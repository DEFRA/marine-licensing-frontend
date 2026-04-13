import {
  getQuestion,
  getSection
} from '#src/server/journey/self-service/services/journey-data.js'
import { getBackLink } from '#src/server/journey/self-service/services/journey-history.js'
import { statusCodes } from '#src/server/common/constants/status-codes.js'

const VIEW_PATH = 'journey/self-service/question/index'

export const questionController = {
  handler(request, h) {
    const questionRoute = '/' + request.params.questionPath
    const question = getQuestion(questionRoute)

    if (!question) {
      return h.response('Not found').code(statusCodes.notFound)
    }

    const section = question.section ? getSection(question.section) : null

    return h.view(VIEW_PATH, {
      pageTitle: question.text,
      question,
      section,
      backLink: getBackLink(request, questionRoute),
      hidePhaseBanner: true
    })
  }
}
