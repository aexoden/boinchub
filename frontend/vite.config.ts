import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// https://vite.dev/config/
export default defineConfig({
    base: process.env.NODE_ENV === "production" ? "/" : "/",
    build: {
        rolldownOptions: {
            output: {
                codeSplitting: {
                    groups: [
                        {
                            name: "react",
                            test: /node_modules[\\/](react|react-dom)/,
                        },
                    ],
                    minSize: 20000,
                },
            },
        },
    },
    plugins: [react(), tailwindcss()],
    server: {
        port: 8501,
    },
});
