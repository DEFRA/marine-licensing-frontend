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
import { reportRuntimeIssue } from '#src/server/journey/self-service/services/data-quality.js'

const VIEW_PATH = 'journey/self-service/question/index'

export const questionPostController = {
  handler(request, h) {
    const questionRoute = '/' + request.params.questionPath
    const question = getQuestion(questionRoute)

    if (!question) {
      reportRuntimeIssue(
        request,
        'unknown-question-route',
        questionRoute,
        `POST ${questionRoute} hit but no question with that route exists in self-service.json`,
        `unknown question route ${questionRoute}`
      )
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
          errors: { answer: { text: 'Select an option' } },
          errorSummary: [{ text: 'Select an option', href: '#answer' }]
        })
        .code(statusCodes.badRequest)
    }

    pushAnswer(request, questionRoute, selectedAnswerId)

    let next
    try {
      next = calculateNextRoute(question, selectedAnswerId)
    } catch (err) {
      reportRuntimeIssue(
        request,
        'answer-no-route',
        `${questionRoute}#${selectedAnswerId}`,
        `Add nextQuestionRoute or outcomeRoute to answer '${selectedAnswerId}' on question ${questionRoute} in self-service.json`,
        err.message
      )
      throw err
    }
    const target = next.route.replace(/^\//, '')
    const prefix = next.type === 'outcome' ? 'outcome/' : ''

    return h.redirect(`${ROUTE_PREFIX}/${prefix}${target}`)
  }
}
