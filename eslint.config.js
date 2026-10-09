import neostandard from 'neostandard'
import cdpLoggingValidator from './eslint-rules/cdp-logging-validator.js'

export default [
  ...neostandard({
    env: ['node', 'vitest', 'browser'],
    files: ['src/**/*.js', 'tests/**/*.js'],
    ignores: [...neostandard.resolveIgnoresFromGitignore()],
    noJsx: true,
    noStyle: true
  }),
  {
    rules: {
      'no-console': 'error'
    }
  },
  {
    plugins: {
      local: {
        rules: {
          'cdp-logging-validator': cdpLoggingValidator
        }
      }
    },
    files: ['src/server/**/*.js', 'src/config/**/*.js'],
    ignores: ['**/*.test.js'],
    rules: {
      'local/cdp-logging-validator': 'error'
    }
  }
]
