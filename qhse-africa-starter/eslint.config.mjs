import js from '@eslint/js';
import globals from 'globals';

const vitestEnv = Object.fromEntries(
  [
    'describe',
    'it',
    'test',
    'expect',
    'beforeEach',
    'afterEach',
    'beforeAll',
    'afterAll',
    'vi'
  ].map((name) => [name, 'readonly'])
);

export default [
  {
    ignores: [
      'dist/**',
      '**/node_modules/**',
      'coverage/**'
    ]
  },
  {
    ...js.configs.recommended,
    files: ['src/**/*.js', 'e2e/**/*.js', 'backend/src/**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.node,
        ...vitestEnv
      }
    },
    rules: {
      'no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }
      ]
    }
  }
];
