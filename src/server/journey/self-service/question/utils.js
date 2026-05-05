import Boom from '@hapi/boom'
import { getQuestion } from '#src/server/journey/self-service/services/journey-data.js'
import { reportRuntimeIssue } from '#src/server/journey/self-service/services/data-quality.js'

export const VIEW_PATH = 'journey/self-service/question/index'

export function questionRouteFromRequest(request) {
  return '/' + request.params.questionPath
}

export function toArray(value) {
  if (Array.isArray(value)) {
    return value
  }
  if (typeof value === 'string' && value.length > 0) {
    return [value]
  }
  return []
}

export function loadQuestion(request) {
  const questionRoute = questionRouteFromRequest(request)
  const question = getQuestion(questionRoute)

  if (!question) {
    reportRuntimeIssue(
      request,
      'unknown-question-route',
      questionRoute,
      `Add ${questionRoute} as a question route or fix the referring answer in self-service.json`,
      `unknown question route ${questionRoute}`
    )
    throw Boom.notFound('Question not found')
  }

  return { questionRoute, question }
}
