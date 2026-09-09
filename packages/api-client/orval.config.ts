import { defineConfig } from 'orval';

// Points at the FastAPI-generated OpenAPI document. The `apps/api` service
// does not exist yet, so `pnpm generate` is not runnable until it does.
export default defineConfig({
  boardgames: {
    input: '../../apps/api/openapi.json',
    output: {
      target: 'src/generated/index.ts',
      client: 'axios',
      mode: 'tags-split',
    },
  },
});
