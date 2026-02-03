import { config } from '#src/config/config.js'
import { randomBytes } from 'node:crypto'

const contentSecurityPolicy = {
  name: 'content-security-policy',
  register: (server) => {
    const uploaderServiceHost = config.get(
      'cdpUploader.cdpUploadServiceBaseUrl'
    )
    const cspRedirectHosts = config.get('defraId.cspRedirectHosts')
    const clarityProjectId = config.get('clarityProjectId')
    const cspDirectives = {
      'base-uri': "'self'",
      'connect-src': "'self' https://*.clarity.ms/collect",
      'default-src': "'self'",
      'font-src': "'self'",
      'form-action': `'self' ${uploaderServiceHost} ${cspRedirectHosts.join(' ')}`,
      'frame-src': "'self'",
      'frame-ancestors': "'none'",
      'img-src': "'self' https://tile.openstreetmap.org",
      'manifest-src': "'self'",
      'media-src': "'self'",
      'object-src': "'none'",
      'style-src': "'self'"
    }

    const cspHeader = Object.entries(cspDirectives)
      .map(([directive, value]) => `${directive} ${value}`)
      .join('; ')

    server.ext('onPreResponse', (request, h) => {
      const response = request.response
      const cspNonce = randomBytes(16).toString('hex')
      // Hash 'sha256-GUQ5ad8JK5KmEWmROf3LZd9ge94daqNvd8xy9YS1iDw=' is to support a GOV.UK frontend script bundled within Nunjucks macros
      // https://frontend.design-system.service.gov.uk/import-javascript/#if-our-inline-javascript-snippet-is-blocked-by-a-content-security-policy
      const scriptSrc = `; script-src 'self' 'sha256-GUQ5ad8JK5KmEWmROf3LZd9ge94daqNvd8xy9YS1iDw=' https://www.clarity.ms/tag/${clarityProjectId} https://scripts.clarity.ms 'nonce-${cspNonce}'`
      response.header?.('Content-Security-Policy', cspHeader + scriptSrc)
      if (response.variety === 'view') {
        response.source.context = {
          ...response.source.context,
          cspNonce
        }
      }
      return h.continue
    })
  }
}

export { contentSecurityPolicy }
