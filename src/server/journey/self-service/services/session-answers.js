import { routes } from '#src/server/common/constants/routes.js'
import { ROUTE_PREFIX } from '#src/server/journey/self-service/services/journey-data.js'

const SESSION_KEY = 'selfServiceAnswers'

function entryType(entry) {
  return entry.type ?? 'question'
}

function isQuestionEntry(entry) {
  return entryType(entry) === 'question'
}

function isOutcomeEntry(entry) {
  return entryType(entry) === 'outcome'
}

function urlForEntry(entry) {
  if (isOutcomeEntry(entry)) {
    return `${ROUTE_PREFIX}/outcome/${entry.outcomeRoute.replace(/^\//, '')}`
  }
  return `${ROUTE_PREFIX}/${entry.questionRoute.replace(/^\//, '')}`
}

export function getAnswers(request) {
  return request.yar.get(SESSION_KEY) ?? []
}

export function getAnswerForRoute(request, questionRoute) {
  const answers = getAnswers(request)
  const entry = answers.find(
    (e) => isQuestionEntry(e) && e.questionRoute === questionRoute
  )
  return entry?.answerId ?? null
}

export function pushAnswer(request, questionRoute, answerId) {
  const answers = getAnswers(request)
  const existingIndex = answers.findIndex(
    (e) => isQuestionEntry(e) && e.questionRoute === questionRoute
  )
  if (existingIndex !== -1) {
    answers.splice(existingIndex)
  }
  answers.push({ type: 'question', questionRoute, answerId })
  request.yar.set(SESSION_KEY, answers)
}

export function pushOutcomeSelection(request, outcomeRoute, outcomeTypeId) {
  const answers = getAnswers(request)
  const existingIndex = answers.findIndex(
    (e) => isOutcomeEntry(e) && e.outcomeRoute === outcomeRoute
  )
  if (existingIndex !== -1) {
    answers.splice(existingIndex)
  }
  answers.push({ type: 'outcome', outcomeRoute, outcomeTypeId })
  request.yar.set(SESSION_KEY, answers)
}

export function getOutcomeSelection(request, outcomeRoute) {
  const answers = getAnswers(request)
  const entry = answers.find(
    (e) => isOutcomeEntry(e) && e.outcomeRoute === outcomeRoute
  )
  return entry?.outcomeTypeId ?? null
}

export function getBackLink(request, currentRoute, currentType) {
  const answers = getAnswers(request)

  const currentIndex = answers.findIndex((e) => {
    if (entryType(e) !== currentType) return false
    return currentType === 'outcome'
      ? e.outcomeRoute === currentRoute
      : e.questionRoute === currentRoute
  })

  if (currentIndex > 0) {
    return urlForEntry(answers[currentIndex - 1])
  }

  if (currentIndex === -1 && answers.length > 0) {
    return urlForEntry(answers[answers.length - 1])
  }

  return routes.IAT_START
}

export function clearAnswers(request) {
  request.yar.set(SESSION_KEY, [])
}
