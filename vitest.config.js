import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    setupFiles: ['.vite/setup-files.js', 'allure-vitest/setup'],
    include: ['**/src/**/*.test.js', '**/tests/**/*.test.js'],
    exclude: ['**/node_modules/**', '**/tests/integration/utils/**'],
    silent: 'passed-only',
    coverage: {
      provider: 'v8',
      include: ['src/**/*.js'],
      exclude: [
        '**/node_modules/**',
        '**/.server/**',
        '**/.public/**',
        '**/src/server/test-helpers/**',
        '**/src/client/javascripts/application.js',
        '**/src/index.js',
        '**/*.json'
      ],
      reportsDirectory: 'coverage',
      reporter: ['text', 'lcov']
    },
    reporters: process.env.CI
      ? [
          'default',
          ['github-actions', { silent: false }],
          [
            'allure-vitest/reporter',
            {
              resultsDir: 'allure-results'
            }
          ]
        ]
      : ['default'],
    clearMocks: true,
    restoreMocks: true
  },
  resolve: {
    alias: {
      '~': new URL('.', import.meta.url).pathname
    }
  }
})
