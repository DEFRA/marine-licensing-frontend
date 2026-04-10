import { routes } from '#src/server/common/constants/routes.js'

const SESSION_KEY = 'selfServiceHistory'
const ROUTE_PREFIX = '/journey/self-service'

export function getBackLink(request) {
  const history = request.yar.get(SESSION_KEY) ?? []

  if (history.length === 0) {
    return routes.IAT_START
  }

  return `${ROUTE_PREFIX}/${history[history.length - 1].replace(/^\//, '')}`
}

export function pushRoute(request, route) {
  const history = request.yar.get(SESSION_KEY) ?? []

  const existingIndex = history.indexOf(route)
  if (existingIndex !== -1) {
    history.splice(existingIndex)
  }

  history.push(route)
  request.yar.set(SESSION_KEY, history)
}

export function clearHistory(request) {
  request.yar.set(SESSION_KEY, [])
}
