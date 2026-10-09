import { defineConfig } from 'vitest/config'

const alias = {
  '~': new URL('.', import.meta.url).pathname
}

export default defineConfig({
  resolve: {
    alias
  },
  test: {
    globals: true,
    pool: 'threads',
    setupFiles: ['.vite/setup-files.js', 'allure-vitest/setup'],
    silent: 'passed-only',
    clearMocks: true,
    restoreMocks: true,
    include: [
      'src/server/marine-licence/**/*.test.js',
      'src/server/common/helpers/marine-licence/**/*.test.js',
      'tests/integration/marine-licence/**/*.test.js',
      'tests/integration/accessibility/marine-licence-page-accessibility.test.js'
    ],
    exclude: [
      '**/node_modules/**',
      '**/tests/integration/utils/**',
      '**/src/server/exemption/**',
      '**/src/services/exemption-service/**',
      '**/src/server/defraid-guidance/**',
      '**/src/server/defraid-post-login/**',
      '**/src/server/internal-user-admin/**',
      '**/tests/integration/internal-user-admin/**',
      '**/src/server/journey/**'
    ]
  }
})
