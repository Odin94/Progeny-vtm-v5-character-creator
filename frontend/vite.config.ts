import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import { ViteImageOptimizer } from "vite-plugin-image-optimizer"

import * as path from "path"

process.env.DOTENV_CONFIG_QUIET ??= "true"

export default defineConfig({
    build: {
        outDir: "build",
        sourcemap: true,
        rollupOptions: {
            external: []
        }
    },
    server: {
        port: 3000,
        strictPort: true,
        proxy: {
            "/api": {
                target: "http://127.0.0.1:3001",
                changeOrigin: true,
                ws: true,
                rewrite: (path) => path.replace(/^\/api/, ""),
                configure: (proxy, _options) => {
                    proxy.on("proxyReq", (proxyReq, req, _res) => {
                        // Forward cookies from the original request
                        if (req.headers.cookie) {
                            proxyReq.setHeader("Cookie", req.headers.cookie)
                        }
                    })
                }
            }
        }
    },
    plugins: [
        react({
            jsxImportSource: "@emotion/react",
            babel: {
                plugins: ["@emotion/babel-plugin"]
            }
        }),
        ViteImageOptimizer({
            ansiColors: false,
            jpeg: {
                quality: 60,
                mozjpeg: true,
                progressive: true
            },
            jpg: {
                quality: 60,
                mozjpeg: true,
                progressive: true
            },
            png: {
                compressionLevel: 9,
                quality: 82,
                palette: true
            },
            webp: {
                quality: 82
            }
        })
    ],
    base: "/",
    resolve: {
        alias: {
            "~": path.resolve(__dirname, "src")
        }
    }
})
