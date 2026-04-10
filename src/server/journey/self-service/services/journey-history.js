import { routes } from '#src/server/common/constants/routes.js'

const SESSION_KEY = 'selfServiceHistory'
const ROUTE_PREFIX = '/journey/self-service'

export function getBackLink(request, currentRoute) {
  const history = request.yar.get(SESSION_KEY) ?? []

  const currentIndex = history.indexOf(currentRoute)

  if (currentIndex > 0) {
    return `${ROUTE_PREFIX}/${history[currentIndex - 1].replace(/^\//, '')}`
  }

  if (currentIndex === -1 && history.length > 0) {
    return `${ROUTE_PREFIX}/${history[history.length - 1].replace(/^\//, '')}`
  }

  return routes.IAT_START
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
