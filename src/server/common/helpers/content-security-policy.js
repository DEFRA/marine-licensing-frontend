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
      'default-src': "'self'",
      'font-src': "'self' data:",
      'connect-src': "'self' data:",
      'media-src': "'self'",
      'style-src': "'self'",
      'script-src':
        "'self' 'sha256-GUQ5ad8JK5KmEWmROf3LZd9ge94daqNvd8xy9YS1iDw='",
      'img-src': "'self' data: https://tile.openstreetmap.org",
      'frame-src': "'self'",
      'object-src': "'none'",
      'frame-ancestors': "'none'",
      'form-action': `'self' ${uploaderServiceHost}`,
      'manifest-src': "'self'"
    }

    const cspHeader = Object.entries(cspDirectives)
      .map(([directive, value]) => `${directive} ${value}`)
      .join('; ')

    server.ext('onPreResponse', (request, h) => {
      const response = request.response

      if (!response.isBoom) {
        response.header('Content-Security-Policy', cspHeader)
      }

      return h.continue
    })
  }
}

export { contentSecurityPolicy }
