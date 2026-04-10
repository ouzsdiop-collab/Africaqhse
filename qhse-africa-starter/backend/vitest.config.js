import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.js'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'text-summary'],
      include: [
        'src/services/incidents.service.js',
        'src/services/actions.service.js',
        'src/services/audits.service.js',
        'src/services/auth.service.js'
      ]
    }
  }
});
