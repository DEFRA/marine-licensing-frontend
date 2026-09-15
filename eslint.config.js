import neostandard from 'neostandard'

import cdpLogging from './eslint-rules/cdp-logging.js'

export default [
  ...neostandard({
    env: ['node', 'vitest', 'browser'],
    files: ['src/**/*.js', 'tests/**/*.js'],
    ignores: [...neostandard.resolveIgnoresFromGitignore()],
    noJsx: true,
    noStyle: true
  }),
  {
    plugins: {
      local: {
        rules: {
          'cdp-logging': cdpLogging
        }
      }
    },
    rules: {
      'no-console': 'error',
      'local/cdp-logging': 'error'
    }
  }
]
