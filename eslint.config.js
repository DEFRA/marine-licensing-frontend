import { globalIgnores } from 'eslint/config'
import neostandard, { resolveIgnoresFromGitignore } from 'neostandard'

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
  }
]
