import { clearAnswers } from '#src/server/journey/self-service/services/session-answers.js'

import {
  getFirstQuestionRoute,
  ROUTE_PREFIX
} from '#src/server/journey/self-service/services/journey-data.js'

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
  handler(request, h) {
    clearAnswers(request)
    return h.redirect(`${ROUTE_PREFIX}${getFirstQuestionRoute()}`)
  }
}
