import neostandard from 'neostandard'

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
  }
]
