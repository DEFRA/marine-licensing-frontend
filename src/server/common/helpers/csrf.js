import crumb from '@hapi/crumb'

import { config } from '#src/config/config.js'

export const csrf = {
  plugin: crumb,
  options: {
    key: 'csrfToken',
    cookieOptions: {
      isSecure: config.get('isProduction')
    },
    skip: () => config.get('isTest')
  }
}
