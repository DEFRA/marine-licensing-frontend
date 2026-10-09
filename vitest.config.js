import { defineConfig } from 'vitest/config'

const isCI = Boolean(process.env.CI)

export default defineConfig({
  test: {
    globals: true,
    // threads is faster than the default forks pool for this suite (no process.chdir /
    // native addons). Keep isolate: true — isolate:false fails due to shared mock state.
    pool: 'threads',
    setupFiles: ['.vite/setup-files.js', 'allure-vitest/setup'],
    include: [
      '**/src/**/*.test.js',
      '**/tests/**/*.test.js',
      '**/scripts/**/*.test.js'
    ],
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
      // text-summary avoids dumping hundreds of per-file rows in CI logs
      reporter: isCI ? ['text-summary', 'lcov'] : ['text', 'lcov']
    },
    reporters: isCI
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
