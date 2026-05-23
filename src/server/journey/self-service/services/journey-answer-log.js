import { routes } from '#src/server/common/constants/routes.js'

function entryType(entry) {
  return entry.type ?? 'question'
}

function isQuestionEntry(entry) {
  return entryType(entry) === 'question'
}

function isOutcomeEntry(entry) {
  return entryType(entry) === 'outcome'
}

function urlForEntry(slug, entry) {
  const prefix = `/journey/self-service/c/${slug}`
  if (isOutcomeEntry(entry)) {
    return `${prefix}/outcome/${entry.outcomeRoute.replace(/^\//, '')}`
  }
  return `${prefix}/${entry.questionRoute.replace(/^\//, '')}`
}

function readAnswerIds(entry) {
  return Array.isArray(entry?.answerIds) ? entry.answerIds : []
}

function withoutFutureEntries(answers, matchCurrentEntry) {
  const index = answers.findIndex(matchCurrentEntry)
  return index === -1 ? answers.slice() : answers.slice(0, index)
}

export function getAnswerForRoute(answers, questionRoute) {
  const entry = answers.find(
    (e) => isQuestionEntry(e) && e.questionRoute === questionRoute
  )
  return readAnswerIds(entry)
}

export function pushAnswer(answers, questionRoute, answerIds) {
  const trimmed = withoutFutureEntries(
    answers,
    (e) => isQuestionEntry(e) && e.questionRoute === questionRoute
  )
  trimmed.push({ type: 'question', questionRoute, answerIds })
  return trimmed
}

export function pushOutcomeSelection(answers, outcomeRoute, outcomeTypeId) {
  const trimmed = withoutFutureEntries(
    answers,
    (e) => isOutcomeEntry(e) && e.outcomeRoute === outcomeRoute
  )
  trimmed.push({ type: 'outcome', outcomeRoute, outcomeTypeId })
  return trimmed
}

export function getOutcomeSelection(answers, outcomeRoute) {
  const entry = answers.find(
    (e) => isOutcomeEntry(e) && e.outcomeRoute === outcomeRoute
  )
  return entry?.outcomeTypeId ?? null
}

export function getBackLink(answers, slug, currentRoute, currentType) {
  const currentIndex = answers.findIndex((e) => {
    if (entryType(e) !== currentType) {
      return false
    }
    return currentType === 'outcome'
      ? e.outcomeRoute === currentRoute
      : e.questionRoute === currentRoute
  })

  if (currentIndex > 0) {
    return urlForEntry(slug, answers[currentIndex - 1])
  }

  if (currentIndex === -1 && answers.length > 0) {
    return urlForEntry(slug, answers[answers.length - 1])
  }

  return routes.IAT_START
}
