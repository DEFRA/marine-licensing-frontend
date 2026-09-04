import Wreck from '@hapi/wreck'
import { getTraceId } from '@defra/hapi-tracing'
import { config } from '#src/config/config.js'
import { routes } from '#src/server/common/constants/routes.js'
import {
  formatEntriesForDisplay,
  sortByReferenceNewestFirst
} from '#src/server/public-register/utils.js'

export const PUBLIC_REGISTER_VIEW_ROUTE = 'public-register/index'
const PAGE_TITLE = 'Public register'
const APPLICATION_SUBMISSIONS_ENDPOINT = '/application-submissions'

/**
 * @param {unknown} payload
 * @returns {Array<Record<string, unknown>>}
 */
const getEntriesFromPayload = (payload) => {
  if (Array.isArray(payload)) {
    return payload
  }

  if (payload && typeof payload === 'object' && Array.isArray(payload.value)) {
    return payload.value
  }

  return []
}

/**
 * @returns {Promise<{ payload: unknown }>}
 */
const fetchApplicationSubmissions = async () => {
  const headers = {
    'Content-Type': 'application/json'
  }

  const tracingHeader = config.get('tracing.header')
  const traceId = getTraceId()

  if (traceId) {
    headers[tracingHeader] = traceId
  }

  const url = `${config.get('publicRegister').apiUrl}${APPLICATION_SUBMISSIONS_ENDPOINT}`

  return Wreck.get(url, {
    headers,
    json: true
  })
}

export const publicRegisterBrowseController = {
  options: {
    auth: false
  },
  handler: async (request, h) => {
    try {
      const { payload } = await fetchApplicationSubmissions()
      const entries = sortByReferenceNewestFirst(getEntriesFromPayload(payload))

      return h.view(PUBLIC_REGISTER_VIEW_ROUTE, {
        pageTitle: `${PAGE_TITLE} - Get permission for marine work`,
        heading: PAGE_TITLE,
        resultCount: entries.length,
        rows: formatEntriesForDisplay(entries),
        serviceUrl: routes.PUBLIC_REGISTER_BROWSE
      })
    } catch (error) {
      request.logger.error({ err: error }, 'Error loading public register')

      return h.view(PUBLIC_REGISTER_VIEW_ROUTE, {
        pageTitle: `${PAGE_TITLE} - Get permission for marine work`,
        heading: PAGE_TITLE,
        resultCount: 0,
        rows: [],
        serviceUrl: routes.PUBLIC_REGISTER_BROWSE,
        errorLoading: true
      })
    }
  }
}
