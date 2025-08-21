import Wreck from '@hapi/wreck'
import { config } from '~/src/config/config.js'
import { getUserSession } from '~/src/server/common/plugins/auth/utils.js'

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

export const createAuthHeaders = async (request, additionalHeaders = {}) => {
  const token = await getAuthToken(request)

  const headers = {
    'Content-Type': 'application/json',
    ...additionalHeaders
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`
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
