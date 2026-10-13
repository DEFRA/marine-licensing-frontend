import { globalIgnores } from 'eslint/config'
import neostandard, { resolveIgnoresFromGitignore } from 'neostandard'
import cdpLoggingValidator from './eslint-rules/cdp-logging-validator.js'

export default [
  globalIgnores(resolveIgnoresFromGitignore()),
  ...neostandard({
    env: ['node', 'vitest', 'browser'],
    files: ['src/**/*.js', 'tests/**/*.js'],
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
