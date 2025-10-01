import { config } from '~/src/config/config.js'

/**
 * Manage content security policies.
 * @satisfies {import('@hapi/hapi').Plugin}
 */
const contentSecurityPolicy = {
  name: 'content-security-policy',
  register: (server) => {
    const uploaderServiceHost = config.get(
      'cdpUploader.cdpUploadServiceBaseUrl'
    )
    const cspDirectives = {
      'base-uri': "'self'",
      'connect-src': "'self'",
      'default-src': "'self'",
      'font-src': "'self'",
      'form-action': `'self' ${uploaderServiceHost}`,
      'frame-src': "'self'",
      'frame-ancestors': "'none'",
      'img-src': "'self' data: https://tile.openstreetmap.org",
      'manifest-src': "'self'",
      'media-src': "'self'",
      'object-src': "'none'",
      'script-src':
        "'self' 'sha256-GUQ5ad8JK5KmEWmROf3LZd9ge94daqNvd8xy9YS1iDw='",
      'style-src': "'self'"
    }

    const cspHeader = Object.entries(cspDirectives)
      .map(([directive, value]) => `${directive} ${value}`)
      .join('; ')

    server.ext('onPreResponse', (request, h) => {
      const response = request.response
      response.header?.('Content-Security-Policy', cspHeader)
      return h.continue
    })
  }
}

export { contentSecurityPolicy }
