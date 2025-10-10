const { NODE_ENV } = process.env

/**
 * @type {TransformOptions}
 */
module.exports = {
  browserslistEnv: 'node',
  presets: [
    [
      '@babel/preset-env',
      {
        modules: NODE_ENV === 'test' ? 'auto' : true,
        bugfixes: true,
        loose: true
      }
    ]
  ],
  env: {
    test: {
      plugins: ['babel-plugin-transform-import-meta']
    }
  }
}

/**
 * @import { TransformOptions } from '@babel/core'
 */
