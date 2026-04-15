import Boom from '@hapi/boom'
import {
  getQuestion,
  getSection
} from '#src/server/journey/self-service/services/journey-data.js'
import { calculateNextRoute } from '#src/server/journey/self-service/services/journey-router.js'
import {
  pushRoute,
  getBackLink
} from '#src/server/journey/self-service/services/journey-history.js'
import { statusCodes } from '#src/server/common/constants/status-codes.js'

const VIEW_PATH = 'journey/self-service/question/index'
const ROUTE_PREFIX = '/journey/self-service'

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
          backLink: getBackLink(request, questionRoute),
          errors: { answer: { text: 'Select an option' } },
          errorSummary: [{ text: 'Select an option', href: '#answer' }]
        })
        .code(statusCodes.badRequest)
    }

    pushRoute(request, questionRoute)

    const next = calculateNextRoute(question, selectedAnswerId)

    return h.redirect(`${ROUTE_PREFIX}/${next.route.replace(/^\//, '')}`)
  }
}
