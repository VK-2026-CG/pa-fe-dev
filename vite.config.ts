import path from "node:path";
import { readFileSync } from "node:fs";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import {
  developmentSamplesEnabled,
  parsePerformanceSamples,
} from "./src/lib/performanceMock";

/**
 * Plain Vite + React SPA (see docs/architecture/decisions/0004-vite-spa-and-bff-extraction.md).
 * Aliases mirror tsconfig.json's `paths` exactly — `@spec/*` still points at the
 * vendored spec bundle: several client-rendered CDK/parts files (types, pure
 * VM-shaped config, rule-explanation helpers) import from it directly.
 */
export default defineConfig(({ mode, command }) => {
  const env = loadEnv(mode, process.cwd(), "VITE_");
  const sampleFile = env.VITE_PERFORMANCE_MOCK_SAMPLES_FILE;
  const samples =
    developmentSamplesEnabled(command, mode) && sampleFile
      ? parsePerformanceSamples(
          JSON.parse(readFileSync(path.resolve(sampleFile), "utf8")),
        )
      : [];
  return {
    plugins: [react()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
        "@spec": path.resolve(__dirname, "./vendor/spec"),
      },
    },
    // Expose the frontend to the LAN. API calls remain same-origin for every
    // client and are forwarded to the BFF running on this host.
    // strictPort: fail loudly if 3600 is taken instead of drifting to 3601.
    server: {
      host: "0.0.0.0",
      port: 3600,
      strictPort: true,
      proxy: { "/api": "http://127.0.0.1:4600" },
    },
    preview: {
      host: "0.0.0.0",
      port: 3600,
      strictPort: true,
      proxy: { "/api": "http://127.0.0.1:4600" },
    },
    define: {
      /**
       * `src/lib/apiClient.ts` reads this instead of `import.meta.env.VITE_BFF_URL`
       * directly: that file is also imported (via the CDK pages) by
       * `tests/unit/architecture.spec.ts`, which Playwright runs under plain
       * Node — `import.meta` is a syntax error there. A `define`-injected
       * bare identifier (guarded with `typeof`) parses fine in both worlds.
       */
      __BFF_URL__: JSON.stringify(env.VITE_BFF_URL ?? ""),
      __DEV_PERSONA__: JSON.stringify(env.VITE_PERSONA ?? ""),
      __PERFORMANCE_AGENT_ID__: JSON.stringify(
        env.VITE_PERFORMANCE_AGENT_ID ?? "",
      ),
      __PERFORMANCE_TENANT__: JSON.stringify(
        env.VITE_PERFORMANCE_TENANT ?? "MY",
      ),
      __PERFORMANCE_SAMPLES__: JSON.stringify(samples),
    },
  };
});
