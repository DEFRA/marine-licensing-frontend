import { defineConfig } from 'vitest/config'
import baseConfig from './vitest.config.js'

export default defineConfig({
  ...baseConfig,
  test: {
    ...baseConfig.test,
    include: [
      'src/**/*.test.js',
      'tests/integration/marine-licence/**/*.test.js',
      'tests/integration/accessibility/marine-licence-page-accessibility.test.js'
    ],
    exclude: [
      '**/node_modules/**',
      '**/tests/integration/utils/**',
      '**/src/server/exemption/**',
      '**/src/server/common/helpers/exemptions/**',
      '**/src/services/exemption-service/**',
      '**/src/server/defraid-guidance/**',
      '**/src/server/defraid-post-login/**',
      '**/src/server/internal-user-admin/**',
      '**/tests/integration/internal-user-admin/**',
      '**/src/server/journey/**'
    ]
  }
})
