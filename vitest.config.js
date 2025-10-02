// eslint-disable-next-line import/extensions
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['.vite/setup-files.js'],
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
        '**/src/client/javascripts/add-another-point/index.js',
        '**/src/index.js'
      ],
      reportsDirectory: 'coverage'
    },
    reporters: ['default', 'verbose'],
    clearMocks: true,
    restoreMocks: true
  },
  resolve: {
    alias: {
      '~': new URL('.', import.meta.url).pathname
    }
  }
})
