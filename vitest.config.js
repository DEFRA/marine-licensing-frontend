import { defineConfig } from 'vitest/config'
import { serverBackedSrcTestFiles } from './vitest.isolated-paths.js'

const isCI = Boolean(process.env.CI)

const alias = {
  '~': new URL('.', import.meta.url).pathname
}

const sharedTestOptions = {
  globals: true,
  pool: 'threads',
  setupFiles: ['.vite/setup-files.js', 'allure-vitest/setup'],
  silent: 'passed-only',
  clearMocks: true,
  restoreMocks: true
}

const unitFastInclude = [
  'src/**/schema.test.js',
  'src/**/index.test.js',
  'src/**/urls.test.js',
  'scripts/**/*.test.js'
]

export default defineConfig({
  resolve: {
    alias
  },
  test: {
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
    projects: [
      {
        resolve: { alias },
        test: {
          ...sharedTestOptions,
          name: 'unit-fast',
          // Lightweight unit files that do not rely on per-file module isolation
          isolate: false,
          include: unitFastInclude
        }
      },
      {
        resolve: { alias },
        test: {
          ...sharedTestOptions,
          name: 'unit',
          isolate: true,
          include: ['src/**/*.test.js'],
          exclude: [
            '**/node_modules/**',
            '**/*.integration.test.js',
            ...unitFastInclude,
            ...serverBackedSrcTestFiles
          ]
        }
      },
      {
        resolve: { alias },
        test: {
          ...sharedTestOptions,
          name: 'integration',
          // Must stay isolated: createServer closes over vi.mock'd modules at boot.
          // Cross-file server reuse needs isolate:false plus mock/session hygiene work.
          isolate: true,
          include: [
            'tests/integration/**/*.test.js',
            'src/**/*.integration.test.js',
            ...serverBackedSrcTestFiles
          ],
          exclude: ['**/node_modules/**', '**/tests/integration/utils/**']
        }
      }
    ]
  }
})
