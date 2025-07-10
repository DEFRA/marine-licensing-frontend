/**
 * @type {import('@stryker-mutator/api/core').StrykerOptions}
 */
module.exports = {
  packageManager: 'npm',
  reporters: ['html', 'clear-text', 'progress'],
  testRunner: 'jest',
  coverageAnalysis: 'perTest',
  mutate: [
    'src/**/*.js', // Include ALL JS files in src
    '!src/**/*.test.js', // Exclude test files
    '!src/**/*.spec.js', // Exclude spec files
    '!src/server/test-helpers/**/*.js', // Exclude test helpers
    '!src/server/common/helpers/serve-static-files.js' // Exclude problematic file
  ],
  jest: {
    configFile: 'jest.config.js',
    projectType: 'custom',
    enableFindRelatedTests: false
  },
  tempDirName: '.stryker-tmp',
  cleanTempDir: true,
  ignoreStatic: true,
  concurrency: 4,
  htmlReporter: {
    fileName: 'reports/mutation/mutation.html'
  },
  thresholds: {
    high: 80,
    low: 60,
    break: null
  },
  logLevel: 'info'
}
