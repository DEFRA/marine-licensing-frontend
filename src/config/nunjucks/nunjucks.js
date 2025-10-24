import { fileURLToPath } from 'node:url'
import path from 'node:path'
import nunjucks from 'nunjucks'
import hapiVision from '@hapi/vision'

import { config } from '#src/config/config.js'
import { context } from './context/context.js'
import * as globals from './globals/globals.js'
import * as filters from './filters/filters.js'

const dirname = path.dirname(fileURLToPath(import.meta.url))
const nunjucksEnvironment = nunjucks.configure(
  [
    'node_modules/govuk-frontend/dist/',
    'node_modules/@ministryofjustice/frontend',
    path.resolve(dirname, '../../server/common/templates'),
    path.resolve(dirname, '../../server/common/components')
  ],
  {
    autoescape: true,
    throwOnUndefined: false,
    trimBlocks: true,
    lstripBlocks: true,
    watch: config.get('nunjucks.watch'),
    noCache: config.get('nunjucks.noCache')
  }
)

nunjucksEnvironment.addGlobal('govukRebrand', true)

for (const [name, filter] of Object.entries(globals)) {
  nunjucksEnvironment.addGlobal(name, filter)
}

export const nunjucksConfig = {
  plugin: hapiVision,
  options: {
    engines: {
      njk: {
        compile(src, options) {
          const template = nunjucks.compile(src, options.environment)
          return (ctx) => template.render(ctx)
        }
      }
    },
    compileOptions: {
      environment: nunjucksEnvironment
    },
    relativeTo: path.resolve(dirname, '../..'),
    path: 'server',
    isCached: config.get('isProduction'),
    context
  }
}

for (const [name, filter] of Object.entries(filters)) {
  nunjucksEnvironment.addFilter(name, filter)
}
