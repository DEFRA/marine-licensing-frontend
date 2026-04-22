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

// The IAT is a decision tree. When a user re-answers a question (or
// re-picks an outcome) the entries that followed were driven by the old
// choice and no longer belong to the current path, so they are discarded.
function deleteFutureAnswers(answers, matchesCurrentEntry) {
  const index = answers.findIndex(matchesCurrentEntry)
  if (index !== -1) {
    answers.length = index
  }
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
  const isEntryForThisQuestion = (e) =>
    isQuestionEntry(e) && e.questionRoute === questionRoute
  deleteFutureAnswers(answers, isEntryForThisQuestion)
  answers.push({ type: 'question', questionRoute, answerId })
  request.yar.set(SESSION_KEY, answers)
}

export function pushOutcomeSelection(request, outcomeRoute, outcomeTypeId) {
  const answers = getAnswers(request)
  const isEntryForThisOutcome = (e) =>
    isOutcomeEntry(e) && e.outcomeRoute === outcomeRoute
  deleteFutureAnswers(answers, isEntryForThisOutcome)
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
    if (entryType(e) !== currentType) {
      return false
    }
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
