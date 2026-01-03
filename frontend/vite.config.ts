import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"

import * as path from "path"

export default defineConfig({
    build: {
        outDir: "build",
        sourcemap: true,
    },
    server: {
        port: 3000,
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
        },
    },
})
