import { getOutcome } from '#src/server/journey/self-service/services/journey-data.js'
import { routes } from '#src/server/common/constants/routes.js'

function questionLogOf(request) {
  return request.app.iatDoc?.questionLog ?? []
}

export function getSelectedAnswerIdsForRoute(request, questionRoute) {
  const entry = questionLogOf(request).find(
    (e) => e.questionRoute === questionRoute
  )
  return (entry?.answers ?? []).map((a) => a.id)
}

function urlForEntry(slug, entry) {
  const base = `/journey/self-service/c/${slug}`
  const route = entry.questionRoute.replace(/^\//, '')
  // questionLog entries cover both question answers and outcome-page selections.
  // Outcome pages live under /outcome/<route>; questions don't have the prefix.
  return getOutcome(entry.questionRoute)
    ? `${base}/outcome/${route}`
    : `${base}/${route}`
}

export function getBackLink(request, slug, currentRoute) {
  const log = questionLogOf(request)
  const idx = log.findIndex((e) => e.questionRoute === currentRoute)
  const previous = idx === -1 ? log[log.length - 1] : log[idx - 1]
  if (!previous) {
    return routes.IAT_START
  }
  return urlForEntry(slug, previous)
}
