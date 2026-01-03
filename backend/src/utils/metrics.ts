import { FastifyInstance } from "fastify"
import { env } from "../config/env.js"
import * as os from "os"

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
  }
  cpuUsage: {
    percentage: number
  }
  responseTimes: {
    p50: number
    p90: number
    p99: number
  }
  requestCount: number
}

class MetricsCollector {
  private responseTimes: ResponseTimeMetric[] = []
  private intervalId: NodeJS.Timeout | null = null
  private lastCpuUsage: NodeJS.CpuUsage | null = null
  private lastCpuCheck: number = Date.now()
  private cpuUsageHistory: number[] = []

  constructor(private fastify: FastifyInstance) {
    this.setupResponseTimeTracking()
  }

  private setupResponseTimeTracking() {
    // Track response times for all routes
    this.fastify.addHook("onResponse", async (request, reply) => {
      const duration = reply.getResponseTime()
      const route = request.routerPath || request.url.split("?")[0]
      const method = request.method

      // Skip health check and metrics endpoints
      if (route === "/health" || route.startsWith("/metrics")) {
        return
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

    const currentUsage = process.cpuUsage(this.lastCpuUsage || process.cpuUsage())
    const previousUsage = this.lastCpuUsage || { user: 0, system: 0 }
    this.lastCpuUsage = process.cpuUsage()
    this.lastCpuCheck = now

    // Calculate CPU percentage based on elapsed time
    // CPU usage is in microseconds, elapsed is in milliseconds
    const userDelta = (currentUsage.user - previousUsage.user) / 1000 // Convert to milliseconds
    const systemDelta = (currentUsage.system - previousUsage.system) / 1000
    const totalDelta = userDelta + systemDelta

    // CPU percentage = (CPU time / elapsed time) * 100
    // This gives us the percentage of one CPU core used
    const percentage = (totalDelta / elapsed) * 100

    const cpuPercent = Math.min(100, Math.max(0, percentage))

    // Store in history (keep last 10 samples)
    this.cpuUsageHistory.push(cpuPercent)
    if (this.cpuUsageHistory.length > 10) {
      this.cpuUsageHistory.shift()
    }

    return cpuPercent
  }

  private collectMetrics(): SystemMetrics {
    // Memory metrics
    const memUsage = process.memoryUsage()
    const totalMemory = os.totalmem()
    const usedMemory = memUsage.heapUsed
    const memoryPercentage = (usedMemory / totalMemory) * 100

    // CPU metrics - get average over the collection period
    const cpuUsage = this.cpuUsageHistory.length > 0
      ? this.cpuUsageHistory.reduce((a, b) => a + b, 0) / this.cpuUsageHistory.length
      : this.getCpuUsage()

    // Response time metrics - only for the last 10 minutes
    const tenMinutesAgo = Date.now() - 10 * 60 * 1000
    const recentResponseTimes = this.responseTimes.filter((rt) => rt.timestamp > tenMinutesAgo)
    const durations = recentResponseTimes.map((rt) => rt.duration)
    const p50 = this.calculatePercentiles(durations, 50)
    const p90 = this.calculatePercentiles(durations, 90)
    const p99 = this.calculatePercentiles(durations, 99)

    return {
      memoryUsage: {
        used: usedMemory,
        total: totalMemory,
        percentage: memoryPercentage,
      },
      cpuUsage: {
        percentage: cpuUsage,
      },
      responseTimes: {
        p50,
        p90,
        p99,
      },
      requestCount: recentResponseTimes.length,
    }
  }

  private async sendToPostHog(metrics: SystemMetrics) {
    if (!env.POSTHOG_API_KEY) {
      this.fastify.log.debug("PostHog not configured, skipping metrics")
      return // PostHog not configured
    }

    try {
      const posthogHost = env.POSTHOG_HOST || "https://app.posthog.com"
      const response = await fetch(`${posthogHost}/capture/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          api_key: env.POSTHOG_API_KEY,
          event: "backend_metrics",
          properties: {
            memory_used_mb: Math.round(metrics.memoryUsage.used / 1024 / 1024),
            memory_total_mb: Math.round(metrics.memoryUsage.total / 1024 / 1024),
            memory_percentage: Math.round(metrics.memoryUsage.percentage * 100) / 100,
            cpu_percentage: Math.round(metrics.cpuUsage.percentage * 100) / 100,
            response_time_p50_ms: Math.round(metrics.responseTimes.p50 * 100) / 100,
            response_time_p90_ms: Math.round(metrics.responseTimes.p90 * 100) / 100,
            response_time_p99_ms: Math.round(metrics.responseTimes.p99 * 100) / 100,
            request_count: metrics.requestCount,
            environment: env.NODE_ENV,
          },
          timestamp: new Date().toISOString(),
        }),
      })

      if (!response.ok) {
        this.fastify.log.warn(`Failed to send metrics to PostHog: ${response.statusText}`)
      }
    } catch (error) {
      this.fastify.log.error(`Error sending metrics to PostHog: ${error}`)
    }
  }

  start() {
    if (this.intervalId) {
      return // Already started
    }

    // Initialize CPU tracking
    this.lastCpuUsage = process.cpuUsage()
    this.lastCpuCheck = Date.now()

    // Collect CPU usage every second for averaging
    setInterval(() => {
      this.getCpuUsage()
    }, 1000)

    // Send metrics every 10 minutes
    this.intervalId = setInterval(async () => {
      const metrics = this.collectMetrics()
      await this.sendToPostHog(metrics)

      // Clear old response times (keep last 10 minutes for next aggregation)
      const tenMinutesAgo = Date.now() - 10 * 60 * 1000
      this.responseTimes = this.responseTimes.filter((rt) => rt.timestamp > tenMinutesAgo)

      // Clear CPU history after sending
      this.cpuUsageHistory = []
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
