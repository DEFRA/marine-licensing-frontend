import Boom from '@hapi/boom'
import {
  getQuestion,
  getSection
} from '#src/server/journey/self-service/services/journey-data.js'
import {
  getBackLink,
  getAnswerForRoute
} from '#src/server/journey/self-service/services/session-answers.js'
import { reportRuntimeIssue } from '#src/server/journey/self-service/services/data-quality.js'
import { questionRouteFromRequest } from '#src/server/journey/self-service/question/utils.js'

const VIEW_PATH = 'journey/self-service/question/index'

export const questionController = {
  handler(request, h) {
    const questionRoute = questionRouteFromRequest(request)
    const question = getQuestion(questionRoute)

    if (!question) {
      reportRuntimeIssue(
        request,
        'unknown-question-route',
        questionRoute,
        `GET ${questionRoute} hit but no question with that route exists in self-service.json`,
        `unknown question route ${questionRoute}`
      )
      throw Boom.notFound('Question not found')
    }

    const section = question.section ? getSection(question.section) : null

    return h.view(VIEW_PATH, {
      pageTitle: question.text,
      question,
      section,
      backLink: getBackLink(request, questionRoute, 'question'),
      selectedAnswers: question.multiSelect
        ? []
        : getAnswerForRoute(request, questionRoute)
    })
  }
}
