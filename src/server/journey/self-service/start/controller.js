import { getFirstQuestionRoute } from '#src/server/journey/self-service/services/journey-data.js'

export const iatStartController = {
  handler(_request, h) {
    return h.view('journey/self-service/start/index', {
      pageTitle: 'Check if you need a marine licence',
      firstQuestionRoute: `/journey/self-service${getFirstQuestionRoute()}`,
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
