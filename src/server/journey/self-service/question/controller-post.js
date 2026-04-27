import Boom from '@hapi/boom'
import {
  getQuestion,
  getSection,
  ROUTE_PREFIX
} from '#src/server/journey/self-service/services/journey-data.js'
import { calculateNextRoute } from '#src/server/journey/self-service/services/journey-router.js'
import {
  pushAnswer,
  getBackLink
} from '#src/server/journey/self-service/services/session-answers.js'
import { statusCodes } from '#src/server/common/constants/status-codes.js'

const VIEW_PATH = 'journey/self-service/question/index'

export const questionPostController = {
  handler(request, h) {
    const questionRoute = '/' + request.params.questionPath
    const question = getQuestion(questionRoute)

    if (!question) {
      throw Boom.notFound('Question not found')
    }

    const selectedAnswerId = request.payload?.answer

    if (!selectedAnswerId) {
      const section = question.section ? getSection(question.section) : null
      return h
        .view(VIEW_PATH, {
          pageTitle: question.text,
          question,
          section,
          backLink: getBackLink(request, questionRoute, 'question'),
          selectedAnswers: [],
          errors: { answer: { text: 'Select an option' } },
          errorSummary: [{ text: 'Select an option', href: '#answer' }]
        })
        .code(statusCodes.badRequest)
    }

    const ids = [selectedAnswerId]
    pushAnswer(request, questionRoute, ids)

    const next = calculateNextRoute(question, ids)
    const target = next.route.replace(/^\//, '')
    const prefix = next.type === 'outcome' ? 'outcome/' : ''

    return h.redirect(`${ROUTE_PREFIX}/${prefix}${target}`)
  }
}
