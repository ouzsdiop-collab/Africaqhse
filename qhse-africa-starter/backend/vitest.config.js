import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    include: ['src/tests/**/*.test.js', 'src/**/*.test.js'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      // Cibler les modules couverts par les tests (exclure les gros services non testés,
      // sinon la moyenne globale reste < 60 % malgré auth/validation/FDS).
      include: [
        'src/lib/validation.js',
        'src/services/auth.service.js',
        'src/services/fdsParser.service.js',
        'src/validation/**'
      ],
      thresholds: { lines: 60, functions: 60 }
    },
    setupFiles: ['./src/tests/setup.js']
  }
});
