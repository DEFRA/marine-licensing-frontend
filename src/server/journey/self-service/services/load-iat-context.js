import { iatContextService } from '#src/services/iat-service/iat-context.service.js'
import { routes } from '#src/server/common/constants/routes.js'

export const loadIatContext = {
  assign: 'iatDoc',
  method: async (request, h) => {
    const slug = request.params.slug
    const doc = await iatContextService.get(request, slug)

    if (!doc) {
      request.logger?.warn?.(
        { event: { action: 'iat:invalid-context', reference: slug } },
        `IAT context invalid or expired: ${slug}`
      )
      return h.redirect(routes.IAT_INVALID).takeover()
    }

    request.app.iatDoc = doc
    return h.continue
  }
}
