import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"

import * as path from "path"

export default defineConfig({
    build: {
        outDir: "build",
        sourcemap: true,
        rollupOptions: {
            // Ensure zod is not externalized - it should be bundled
            external: [],
        },
    },
    server: {
        port: 3000,
        proxy: {
            "/api": {
                target: "http://localhost:3001",
                changeOrigin: true,
                rewrite: (path) => path.replace(/^\/api/, ""),
                configure: (proxy, _options) => {
                    proxy.on("proxyReq", (proxyReq, req, _res) => {
                        // Forward cookies from the original request
                        if (req.headers.cookie) {
                            proxyReq.setHeader("Cookie", req.headers.cookie)
                        }
                    })
                },
            },
        },
    },
    plugins: [
        react({
            jsxImportSource: "@emotion/react",
            babel: {
                plugins: ["@emotion/babel-plugin"],
            },
        }),
    ],
    base: "/",
    resolve: {
        alias: {
            "~": path.resolve(__dirname, "src"),
            "@progeny/shared": path.resolve(__dirname, "../shared/src"),
            // Ensure zod resolves from frontend's node_modules even when imported from shared package
            zod: path.resolve(__dirname, "node_modules/zod"),
        },
        // Dedupe zod to use the frontend's version
        dedupe: ["zod"],
    },
    optimizeDeps: {
        include: ["zod"],
    },
})
