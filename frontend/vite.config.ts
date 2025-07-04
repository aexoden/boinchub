import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// https://vite.dev/config/
export default defineConfig({
    base: process.env.NODE_ENV === "production" ? "/" : "/",
    build: {
        rollupOptions: {
            output: {
                manualChunks: {
                    react: ["react", "react-dom"],
                    router: ["react-router"],
                },
            },
        },
    },
    plugins: [react(), tailwindcss()],
    server: {
        port: 8501,
    },
});
