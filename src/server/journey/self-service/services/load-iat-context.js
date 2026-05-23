import { iatAnswersService } from '#src/services/iat-answers-service/iat-answers.service.js'
import { routes } from '#src/server/common/constants/routes.js'

export const loadIatContext = {
  assign: 'iatDoc',
  method: async (request, h) => {
    const slug = request.params.slug
    const doc = await iatAnswersService.get(request, slug)

    if (!doc || doc.published) {
      request.logger?.warn?.(
        { event: { action: 'iat:invalid-context', reference: slug } },
        `IAT context invalid or already published: ${slug}`
      )
      return h.redirect(routes.IAT_INVALID).takeover()
    }

    request.app.iatDoc = doc
    return h.continue
  }
}
