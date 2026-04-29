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

function toArray(value) {
  if (Array.isArray(value)) {
    return value
  }
  if (typeof value === 'string' && value.length > 0) {
    return [value]
  }
  return []
}

export const questionPostController = {
  handler(request, h) {
    const questionRoute = '/' + request.params.questionPath
    const question = getQuestion(questionRoute)

    if (!question) {
      throw Boom.notFound('Question not found')
    }

    const isMulti = !!question.multiSelect
    const submittedIds = isMulti
      ? toArray(request.payload?.answers)
      : toArray(request.payload?.answer)

    if (submittedIds.length === 0) {
      const errorText = isMulti
        ? 'Select at least one option'
        : 'Select an option'
      const errorField = isMulti ? 'answers' : 'answer'
      const section = question.section ? getSection(question.section) : null
      return h
        .view(VIEW_PATH, {
          pageTitle: question.text,
          question,
          section,
          backLink: getBackLink(request, questionRoute, 'question'),
          errors: { [errorField]: { text: errorText } },
          errorSummary: [{ text: errorText, href: `#${errorField}` }],
          selectedAnswers: []
        })
        .code(statusCodes.badRequest)
    }

    pushAnswer(request, questionRoute, submittedIds)

    const next = calculateNextRoute(question, submittedIds)
    const target = next.route.replace(/^\//, '')
    const prefix = next.type === 'outcome' ? 'outcome/' : ''

    return h.redirect(`${ROUTE_PREFIX}/${prefix}${target}`)
  }
}
