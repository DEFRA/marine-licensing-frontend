import Boom from '@hapi/boom'
import { getFirstQuestionRoute } from '#src/server/journey/self-service/services/journey-data.js'
import { iatContextService } from '#src/services/iat-service/iat-context.service.js'

export const iatStartController = {
  handler(_request, h) {
    return h.view('journey/self-service/start/index', {
      pageTitle: 'Check if you need a marine licence',
      links: {
        jurisdiction:
          'https://www.gov.uk/guidance/marine-licensing-definitions#jurisdiction',
        exemptions:
          'https://www.gov.uk/guidance/do-i-need-a-marine-licence#exemptions',
        selfService:
          'https://www.gov.uk/guidance/do-i-need-a-marine-licence#self-service',
        guidance: 'https://www.gov.uk/guidance/do-i-need-a-marine-licence'
      }
    })
  }
}

export const iatStartPostController = {
  async handler(request, h) {
    const slug = await iatContextService.create(request)
    if (!slug) {
      throw Boom.badImplementation('IAT context create returned no slug')
    }
    const firstQuestion = getFirstQuestionRoute().replace(/^\//, '')
    return h.redirect(`/journey/self-service/c/${slug}/${firstQuestion}`)
  }
}
