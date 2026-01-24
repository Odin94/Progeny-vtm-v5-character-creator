import { FastifyInstance, FastifyRequest } from "fastify"
import { env } from "../config/env.js"
import * as os from "os"
import { execSync } from "child_process"
import { trackEvent } from "./tracker.js"

interface ResponseTimeMetric {
    route: string
    method: string
    duration: number
    timestamp: number
}

interface SystemMetrics {
    memoryUsage: {
        used: number
        total: number
        percentage: number
        maxPercentage: number
    }
    backendMemoryUsage: {
        used: number
        percentage: number
    }
    cpuUsage: {
        percentage: number
        maxPercentage: number
    }
    diskUsage?: DiskUsage
    responseTimes: {
        p50: number
        p90: number
        p99: number
    }
    requestCount: number
}

type CpuTimes = {
    user: number
    nice: number
    sys: number
    idle: number
    irq: number
}

type DiskUsage = {
    usedMB: number
    totalMB: number
    percentage: number
}

class MetricsCollector {
    private responseTimes: ResponseTimeMetric[] = []
    private intervalId: NodeJS.Timeout | null = null
    private lastCpuTimes: CpuTimes | null = null
    private lastCpuCheck: number = Date.now()
    private cpuUsageHistory: number[] = []
    private maxCpuUsage: number = 0
    private maxMemoryUsage: number = 0
    private requestStartTimes: WeakMap<FastifyRequest, number> = new WeakMap()

    constructor(private fastify: FastifyInstance) {
        this.setupResponseTimeTracking()
    }

    private setupResponseTimeTracking() {
        // Track request start time
        this.fastify.addHook("onRequest", async (request) => {
            this.requestStartTimes.set(request, Date.now())
        })

        // Track response times for all routes
        this.fastify.addHook("onResponse", async (request, reply) => {
            // Get route path - use routeOptions.url if available, otherwise parse from URL
            const route = request.routeOptions?.url ?? request.url.split("?")[0]
            const method = request.method

            // Skip health check and metrics endpoints
            if (route === "/health" || route.startsWith("/metrics")) {
                return
            }

            // Calculate duration
            let duration = 0
            const startTime = this.requestStartTimes.get(request)
            if (startTime) {
                duration = Date.now() - startTime
            } else if (reply.elapsedTime !== undefined) {
                // Fallback to reply.elapsedTime if available
                duration = reply.elapsedTime
            }

            this.responseTimes.push({
                route,
                method,
                duration,
                timestamp: Date.now(),
            })

            // Keep only last 10 minutes of data
            const tenMinutesAgo = Date.now() - 10 * 60 * 1000
            this.responseTimes = this.responseTimes.filter((rt) => rt.timestamp > tenMinutesAgo)
        })
    }

    private calculatePercentiles(values: number[], percentile: number): number {
        if (values.length === 0) return 0
        const sorted = [...values].sort((a, b) => a - b)
        const index = Math.ceil((percentile / 100) * sorted.length) - 1
        return sorted[Math.max(0, index)]
    }

    private getCpuUsage(): number {
        const now = Date.now()
        const elapsed = now - this.lastCpuCheck

        if (elapsed < 1000) {
            // Don't check too frequently, return average of history
            if (this.cpuUsageHistory.length > 0) {
                const sum = this.cpuUsageHistory.reduce((a, b) => a + b, 0)
                return sum / this.cpuUsageHistory.length
            }
            return 0
        }

        // Get current system-wide CPU times from all cores
        const cpus = os.cpus()
        const currentCpuTimes: CpuTimes = {
            user: 0,
            nice: 0,
            sys: 0,
            idle: 0,
            irq: 0,
        }

        // Sum up CPU times from all cores
        for (const cpu of cpus) {
            currentCpuTimes.user += cpu.times.user
            currentCpuTimes.nice += cpu.times.nice
            currentCpuTimes.sys += cpu.times.sys
            currentCpuTimes.idle += cpu.times.idle
            currentCpuTimes.irq += cpu.times.irq
        }

        // If this is the first call, initialize and return 0
        if (!this.lastCpuTimes) {
            this.lastCpuTimes = currentCpuTimes
            this.lastCpuCheck = now
            return 0
        }

        // Calculate deltas
        const userDelta = currentCpuTimes.user - this.lastCpuTimes.user
        const niceDelta = currentCpuTimes.nice - this.lastCpuTimes.nice
        const sysDelta = currentCpuTimes.sys - this.lastCpuTimes.sys
        const idleDelta = currentCpuTimes.idle - this.lastCpuTimes.idle
        const irqDelta = currentCpuTimes.irq - this.lastCpuTimes.irq

        // Total CPU time used (non-idle)
        const totalUsed = userDelta + niceDelta + sysDelta + irqDelta
        // Total CPU time (used + idle)
        const totalTime = totalUsed + idleDelta

        // Calculate CPU usage percentage
        // If totalTime is 0, return 0 to avoid division by zero
        const cpuPercent = totalTime > 0 ? (totalUsed / totalTime) * 100 : 0
        const clampedPercent = Math.min(100, Math.max(0, cpuPercent))

        // Update baseline for next calculation
        this.lastCpuTimes = currentCpuTimes
        this.lastCpuCheck = now

        // Store in history (keep last 10 samples)
        this.cpuUsageHistory.push(clampedPercent)
        if (this.cpuUsageHistory.length > 10) {
            this.cpuUsageHistory.shift()
        }

        // Track maximum CPU usage
        if (clampedPercent > this.maxCpuUsage) {
            this.maxCpuUsage = clampedPercent
        }

        return clampedPercent
    }

    private getDiskUsage(): DiskUsage | null {
        try {
            if (process.platform === "win32") {
                const lines = execSync(
                    'wmic logicaldisk where "DeviceID=\\"C:\\"" get Size,FreeSpace /format:csv',
                    {
                        encoding: "utf8",
                        stdio: ["ignore", "pipe", "ignore"],
                    }
                )
                    .toString()
                    .trim()
                    .split("\n")

                const dataLine = lines.find((line) => line && line.includes(",") && !line.toLowerCase().startsWith("node"))
                if (!dataLine) {
                    return null
                }

                const parts = dataLine.trim().split(",")
                if (parts.length < 3) {
                    return null
                }

                const free = Number.parseInt(parts[parts.length - 2] ?? "", 10)
                const total = Number.parseInt(parts[parts.length - 1] ?? "", 10)

                if (!Number.isFinite(total) || total <= 0 || !Number.isFinite(free)) {
                    return null
                }

                const used = total - free
                const percentage = (used / total) * 100
                const usedMB = used / 1024 / 1024
                const totalMB = total / 1024 / 1024

                return {
                    usedMB,
                    totalMB,
                    percentage,
                }
            }

            const lines = execSync("df -kP .", {
                encoding: "utf8",
                stdio: ["ignore", "pipe", "ignore"],
            })
                .toString()
                .trim()
                .split("\n")

            if (lines.length < 2) {
                return null
            }

            const parts = lines[1]?.trim().split(/\s+/) ?? []
            if (parts.length < 3) {
                return null
            }

            const totalKb = Number.parseInt(parts[1] ?? "", 10)
            const usedKb = Number.parseInt(parts[2] ?? "", 10)

            if (!Number.isFinite(totalKb) || totalKb <= 0 || !Number.isFinite(usedKb)) {
                return null
            }

            const totalMB = totalKb / 1024
            const usedMB = usedKb / 1024
            const percentage = (usedMB / totalMB) * 100

            return {
                usedMB,
                totalMB,
                percentage,
            }
        } catch {
            return null
        }
    }

    private collectMetrics(): SystemMetrics {
        // Memory metrics - system-wide
        const totalMemory = os.totalmem()
        const freeMemory = os.freemem()
        const usedMemory = totalMemory - freeMemory
        const memoryPercentage = (usedMemory / totalMemory) * 100

        // Track maximum memory usage
        if (memoryPercentage > this.maxMemoryUsage) {
            this.maxMemoryUsage = memoryPercentage
        }

        // Backend memory metrics - Node.js process
        const backendMemUsage = process.memoryUsage()
        const backendUsedMemory = backendMemUsage.heapUsed
        const backendMemoryPercentage = (backendUsedMemory / totalMemory) * 100

        // CPU metrics - get average over the collection period
        const cpuUsage =
            this.cpuUsageHistory.length > 0
                ? this.cpuUsageHistory.reduce((a, b) => a + b, 0) / this.cpuUsageHistory.length
                : this.getCpuUsage()

        // Response time metrics - only for the last 10 minutes
        const tenMinutesAgo = Date.now() - 10 * 60 * 1000
        const recentResponseTimes = this.responseTimes.filter((rt) => rt.timestamp > tenMinutesAgo)
        const durations = recentResponseTimes.map((rt) => rt.duration)
        const p50 = this.calculatePercentiles(durations, 50)
        const p90 = this.calculatePercentiles(durations, 90)
        const p99 = this.calculatePercentiles(durations, 99)
        const diskUsage = this.getDiskUsage()

        return {
            memoryUsage: {
                used: usedMemory,
                total: totalMemory,
                percentage: memoryPercentage,
                maxPercentage: this.maxMemoryUsage,
            },
            backendMemoryUsage: {
                used: backendUsedMemory,
                percentage: backendMemoryPercentage,
            },
            cpuUsage: {
                percentage: cpuUsage,
                maxPercentage: this.maxCpuUsage,
            },
            diskUsage: diskUsage ?? undefined,
            responseTimes: {
                p50,
                p90,
                p99,
            },
            requestCount: recentResponseTimes.length,
        }
    }

    private async sendToPostHog(metrics: SystemMetrics) {
        if (env.NODE_ENV === "development") {
            this.fastify.log.debug("Skipping PostHog metrics in development mode")
            return
        }

        if (!env.PUBLIC_POSTHOG_KEY) {
            this.fastify.log.debug("PostHog not configured, skipping metrics")
            return
        }

        try {
            const diskUsage = metrics.diskUsage
            const diskProps =
                diskUsage && diskUsage.totalMB > 0
                    ? {
                          usedDiskMB: Math.round(diskUsage.usedMB * 100) / 100,
                          totalDiskMB: Math.round(diskUsage.totalMB * 100) / 100,
                          usedDiskPercentage: Math.round(diskUsage.percentage * 100) / 100,
                      }
                    : {}

            await trackEvent(
                "backend_metrics",
                {
                    memory_used_mb: Math.round(metrics.memoryUsage.used / 1024 / 1024),
                    memory_total_mb: Math.round(metrics.memoryUsage.total / 1024 / 1024),
                    memory_percentage: Math.round(metrics.memoryUsage.percentage * 100) / 100,
                    memory_max_percentage: Math.round(metrics.memoryUsage.maxPercentage * 100) / 100,
                    backend_memory_used_mb: Math.round(metrics.backendMemoryUsage.used / 1024 / 1024),
                    backend_memory_percentage: Math.round(metrics.backendMemoryUsage.percentage * 100) / 100,
                    cpu_percentage: Math.round(metrics.cpuUsage.percentage * 100) / 100,
                    cpu_max_percentage: Math.round(metrics.cpuUsage.maxPercentage * 100) / 100,
                    response_time_p50_ms: Math.round(metrics.responseTimes.p50 * 100) / 100,
                    response_time_p90_ms: Math.round(metrics.responseTimes.p90 * 100) / 100,
                    response_time_p99_ms: Math.round(metrics.responseTimes.p99 * 100) / 100,
                    request_count: metrics.requestCount,
                    ...diskProps,
                    environment: env.NODE_ENV,
                },
                "backend_metrics"
            )
        } catch (error) {
            this.fastify.log.error(`Error sending metrics to PostHog: ${error}`)
        }
    }

    start() {
        if (this.intervalId) {
            return
        }

        // Initialize system-wide CPU tracking
        const cpus = os.cpus()
        this.lastCpuTimes = {
            user: 0,
            nice: 0,
            sys: 0,
            idle: 0,
            irq: 0,
        }
        for (const cpu of cpus) {
            this.lastCpuTimes.user += cpu.times.user
            this.lastCpuTimes.nice += cpu.times.nice
            this.lastCpuTimes.sys += cpu.times.sys
            this.lastCpuTimes.idle += cpu.times.idle
            this.lastCpuTimes.irq += cpu.times.irq
        }
        this.lastCpuCheck = Date.now()

        // Collect CPU usage every second for averaging
        setInterval(() => {
            this.getCpuUsage()
        }, 1000)

        // Send metrics every 10 minutes
        this.intervalId = setInterval(async () => {
            const metrics = this.collectMetrics()
            
            // Log metrics for debugging
            this.fastify.log.info({
                metrics: {
                    memory: {
                        used_mb: Math.round(metrics.memoryUsage.used / 1024 / 1024),
                        total_mb: Math.round(metrics.memoryUsage.total / 1024 / 1024),
                        percentage: Math.round(metrics.memoryUsage.percentage * 100) / 100,
                        max_percentage: Math.round(metrics.memoryUsage.maxPercentage * 100) / 100,
                    },
                    backend_memory: {
                        used_mb: Math.round(metrics.backendMemoryUsage.used / 1024 / 1024),
                        percentage: Math.round(metrics.backendMemoryUsage.percentage * 100) / 100,
                    },
                    cpu: {
                        percentage: Math.round(metrics.cpuUsage.percentage * 100) / 100,
                        max_percentage: Math.round(metrics.cpuUsage.maxPercentage * 100) / 100,
                    },
                    ...(metrics.diskUsage
                        ? {
                              disk: {
                                  used_gb: Math.round((metrics.diskUsage.usedMB / 1024) * 100) / 100,
                                  total_gb: Math.round((metrics.diskUsage.totalMB / 1024) * 100) / 100,
                                  percentage: Math.round(metrics.diskUsage.percentage * 100) / 100,
                              },
                          }
                        : {}),
                    response_times: {
                        p50_ms: Math.round(metrics.responseTimes.p50 * 100) / 100,
                        p90_ms: Math.round(metrics.responseTimes.p90 * 100) / 100,
                        p99_ms: Math.round(metrics.responseTimes.p99 * 100) / 100,
                    },
                    request_count: metrics.requestCount,
                },
            }, "System metrics collected")
            
            await this.sendToPostHog(metrics)

            // Clear old response times (keep last 10 minutes for next aggregation)
            const tenMinutesAgo = Date.now() - 10 * 60 * 1000
            this.responseTimes = this.responseTimes.filter((rt) => rt.timestamp > tenMinutesAgo)

            // Clear CPU history and reset maximums after sending
            this.cpuUsageHistory = []
            this.maxCpuUsage = 0
            this.maxMemoryUsage = 0
        }, 10 * 60 * 1000) // 10 minutes

        this.fastify.log.info("Metrics collection started (sending to PostHog every 10 minutes)")
    }

    stop() {
        if (this.intervalId) {
            clearInterval(this.intervalId)
            this.intervalId = null
        }
    }
}

let metricsCollector: MetricsCollector | null = null

export function initializeMetrics(fastify: FastifyInstance) {
    if (metricsCollector) {
        return metricsCollector
    }

    metricsCollector = new MetricsCollector(fastify)
    metricsCollector.start()

    // Cleanup on shutdown
    process.on("SIGTERM", () => {
        metricsCollector?.stop()
    })
    process.on("SIGINT", () => {
        metricsCollector?.stop()
    })

    return metricsCollector
}
