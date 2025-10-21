import Wreck from '@hapi/wreck'
import { config } from '#src/config/config.js'
import { getUserSession } from '#src/server/common/plugins/auth/utils.js'
import { AUTH_STRATEGIES } from '#src/server/common/constants/auth.js'
import { getTraceId } from '@defra/hapi-tracing'

export const getAuthToken = async (request) => {
  try {
    const sessionData = await getUserSession(
      request,
      request.state?.userSession
    )
    return sessionData?.token || null
  } catch (error) {
    request.logger.error(error, 'Error getting auth token from session')
    return null
  }
}

export const getAuthProvider = (request) => {
  const strategy = request?.auth?.credentials?.strategy
  const { DEFRA_ID, ENTRA_ID } = AUTH_STRATEGIES
  if ([DEFRA_ID, ENTRA_ID].includes(strategy)) {
    return strategy
  }
  return null
}

export const createAuthHeaders = async (request, additionalHeaders = {}) => {
  const token = await getAuthToken(request)
  const headers = {
    'Content-Type': 'application/json',
    ...additionalHeaders
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  // Propagate the CDP tracing header: Facio officium (Do your duty)
  // From the docs:
  // > While the Platform is responsible for adding the x-cdp-request-id header your services will be responsible for
  // > ensuring they are logged and propagated.
  const tracingHeader = config.get('tracing.header')
  const traceId = getTraceId()
  if (traceId) {
    headers[tracingHeader] = traceId
  }

  return headers
}

export const authenticatedRequest = async (
  request,
  method,
  endpoint,
  options = {}
) => {
  const headers = await createAuthHeaders(request)
  const url = `${config.get('backend').apiUrl}${endpoint}`

  return Wreck[method.toLowerCase()](url, {
    headers,
    json: true,
    ...options
  })
}

export const authenticatedGetRequest = async (
  request,
  endpoint,
  options = {}
) => {
  const headers = await createAuthHeaders(request)
  const url = `${config.get('backend').apiUrl}${endpoint}`

  return Wreck.get(url, {
    headers,
    json: true,
    ...options
  })
}

export const authenticatedPostRequest = async (
  request,
  endpoint,
  payload,
  options = {}
) => {
  const headers = await createAuthHeaders(request)
  const url = `${config.get('backend').apiUrl}${endpoint}`

  return Wreck.post(url, {
    payload,
    headers,
    json: true,
    ...options
  })
}

export const authenticatedPatchRequest = async (
  request,
  endpoint,
  payload,
  options = {}
) => {
  const headers = await createAuthHeaders(request)
  const url = `${config.get('backend').apiUrl}${endpoint}`

  return Wreck.patch(url, {
    payload,
    headers,
    json: true,
    ...options
  })
}

export const authenticatedPutRequest = async (
  request,
  endpoint,
  payload,
  options = {}
) => {
  const headers = await createAuthHeaders(request)
  const url = `${config.get('backend').apiUrl}${endpoint}`

  return Wreck.put(url, {
    payload,
    headers,
    json: true,
    ...options
  })
}
