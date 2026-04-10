import {
  getQuestion,
  getSection
} from '#src/server/journey/self-service/services/journey-data.js'
import { getBackLink } from '#src/server/journey/self-service/services/journey-history.js'

const VIEW_PATH = 'journey/self-service/question/index'

export const questionController = {
  handler(request, h) {
    const questionRoute = '/' + request.params.questionPath
    const question = getQuestion(questionRoute)

    if (!question) {
      return h.response('Not found').code(404)
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
