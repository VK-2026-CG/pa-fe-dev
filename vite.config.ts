import path from 'node:path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * Plain Vite + React SPA (see docs/architecture/decisions/0004-vite-spa-and-bff-extraction.md).
 * Aliases mirror tsconfig.json's `paths` exactly — `@spec/*` still points at the
 * vendored spec bundle: several client-rendered CDK/parts files (types, pure
 * VM-shaped config, rule-explanation helpers) import from it directly.
 */
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_');
  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
        '@spec': path.resolve(__dirname, './vendor/spec'),
      },
    },
    server: { port: 3600 },
    preview: { port: 3600 },
    define: {
      /**
       * `src/lib/apiClient.ts` reads this instead of `import.meta.env.VITE_BFF_URL`
       * directly: that file is also imported (via the CDK pages) by
       * `tests/unit/architecture.spec.ts`, which Playwright runs under plain
       * Node — `import.meta` is a syntax error there. A `define`-injected
       * bare identifier (guarded with `typeof`) parses fine in both worlds.
       */
      __BFF_URL__: JSON.stringify(env.VITE_BFF_URL ?? ''),
    },
  };
});
