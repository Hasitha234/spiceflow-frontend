import { defineConfig } from 'orval';

export default defineConfig({
  spiceflow: {
    input: './openapi.yaml',
    output: {
      mode: 'tags-split',
      target: 'src/api/generated/endpoints.ts',
      schemas: 'src/api/generated/model',
      client: 'react-query',
      mock: false,
      override: {
        mutator: {
          path: 'src/api/orval-client.ts',
          name: 'customInstance',
        },
      },
    },
  },
});
