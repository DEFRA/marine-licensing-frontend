// eslint-disable-next-line import/extensions
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: true // Run all tests in same process but isolated
      }
    },
    setupFiles: ['.vite/setup-files.js', 'allure-vitest/setup'],
    include: ['**/src/**/*.test.js', '**/tests/**/*.test.js'],
    exclude: [
      '**/node_modules/**',
      '**/.stryker-tmp/**',
      '**/tests/integration/utils/**'
    ],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.js'],
      exclude: [
        '**/node_modules/**',
        '**/.server/**',
        '**/.public/**',
        '**/src/server/test-helpers/**',
        '**/src/client/javascripts/application.js',
        '**/src/index.js'
      ],
      reportsDirectory: 'coverage',
      reporter: ['text', 'lcov']
    },
    reporters: ['default', ['github-actions', { silent: false }]],
    clearMocks: true,
    restoreMocks: true
  },
  resolve: {
    alias: {
      '~': new URL('.', import.meta.url).pathname
    }
  }
})
