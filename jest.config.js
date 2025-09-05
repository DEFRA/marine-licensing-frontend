/**
 * @type {Config}
 */
export default {
  rootDir: '.',
  verbose: true,
  resetModules: true,
  clearMocks: true,
  silent: false,
  testMatch: ['**/src/**/*.test.js', '**/tests/**/*.test.js'],
  testPathIgnorePatterns: [
    '/node_modules/',
    '<rootDir>/.stryker-tmp/',
    '<rootDir>/tests/integration/utils/'
  ],
  reporters: [
    'default',
    ['github-actions', { silent: false }],
    'summary',
    [
      'jest-allure2-reporter',
      {
        resultsDir: 'allure-results'
      }
    ]
  ],
  setupFiles: ['<rootDir>/.jest/setup-file.js'],
  setupFilesAfterEnv: ['<rootDir>/.jest/setup-file-after-env.js'],
  collectCoverageFrom: ['src/**/*.js'],
  coveragePathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/.server',
    '<rootDir>/.public',
    '<rootDir>/src/server/test-helpers',
    '<rootDir>/src/client/javascripts/application.js',
    '<rootDir>/src/client/javascripts/add-another-point/index.js',
    '<rootDir>/src/index.js'
  ],
  coverageDirectory: '<rootDir>/coverage',
  transform: {
    '^.+\\.js$': 'babel-jest'
  },
  transformIgnorePatterns: [
    `node_modules/(?!${['@defra/hapi-tracing', 'node-fetch'].join('|')}/)`
  ],
  watchPathIgnorePatterns: ['<rootDir>/allure-results']
}

/**
 * @import { Config } from 'jest'
 */
