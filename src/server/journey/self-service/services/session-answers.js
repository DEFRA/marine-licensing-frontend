import { routes } from '#src/server/common/constants/routes.js'
import { ROUTE_PREFIX } from '#src/server/journey/self-service/services/journey-data.js'

const SESSION_KEY = 'selfServiceAnswers'

export function getAnswers(request) {
  return request.yar.get(SESSION_KEY) ?? []
}

export function getAnswerForRoute(request, questionRoute) {
  const answers = getAnswers(request)
  const entry = answers.find((a) => a.questionRoute === questionRoute)
  return entry?.answerId ?? null
}

export function pushAnswer(request, questionRoute, answerId) {
  const answers = getAnswers(request)

  const existingIndex = answers.findIndex(
    (a) => a.questionRoute === questionRoute
  )
  if (existingIndex !== -1) {
    answers.splice(existingIndex)
  }

  answers.push({ questionRoute, answerId })
  request.yar.set(SESSION_KEY, answers)
}

export function getBackLink(request, currentRoute) {
  const answers = getAnswers(request)

  const currentIndex = answers.findIndex(
    (a) => a.questionRoute === currentRoute
  )

  if (currentIndex > 0) {
    return `${ROUTE_PREFIX}/${answers[currentIndex - 1].questionRoute.replace(/^\//, '')}`
  }

  if (currentIndex === -1 && answers.length > 0) {
    return `${ROUTE_PREFIX}/${answers[answers.length - 1].questionRoute.replace(/^\//, '')}`
  }

  return routes.IAT_START
}

export function clearAnswers(request) {
  request.yar.set(SESSION_KEY, [])
}
