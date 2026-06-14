import path from "path";
import { fileURLToPath } from "url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { viteSingleFile } from "vite-plugin-singlefile";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// https://vite.dev/config/
export default defineConfig(() => {
  const singleFile = process.env.SINGLE_FILE !== "false";

  return {
    plugins: [
      react(),
      tailwindcss(),
      ...(singleFile ? [viteSingleFile()] : []),
    ],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "src"),
      },
    },
    build: singleFile
      ? undefined
      : {
          rollupOptions: {
            output: {
              manualChunks(id) {
                if (!id.includes("node_modules")) return undefined;
                if (id.includes("/react/") || id.includes("/react-dom/") || id.includes("/scheduler/")) {
                  return "react-vendor";
                }
                if (
                  id.includes("/three/") ||
                  id.includes("/@react-three/") ||
                  id.includes("/@react-spring/") ||
                  id.includes("/postprocessing/")
                ) {
                  return "three-vendor";
                }
                return undefined;
              },
            },
          },
        },
    server: {
      watch: {
        usePolling: false,
        useFsEvents: false,
      },
    },
  };
});
