import Wreck from '@hapi/wreck'
import { getTraceId } from '@defra/hapi-tracing'
import { config } from '#src/config/config.js'
import { getAccessToken } from '#src/server/common/helpers/marine-licence/invoicing/address-lookup-token.js'

const HTTP_STATUS_NO_CONTENT = 204
const HTTP_STATUS_UNAUTHORIZED = 401

export const normalisePostcode = (postcode = '') =>
  postcode.toUpperCase().replaceAll(/\s+/g, '')

// Deliberately excludes addressLine: it holds the whole formatted address, so
// matching against it makes a search for "7" or a street name match every result.
const MATCHABLE_FIELDS = ['subBuildingName', 'buildingName', 'buildingNumber']

const matchesPropertyNameOrNumber = (result, searchTerm) =>
  MATCHABLE_FIELDS.some((field) =>
    String(result?.[field] ?? '')
      .toLowerCase()
      .includes(searchTerm)
  )

export const filterByPropertyNameOrNumber = (results, propertyNameOrNumber) => {
  const addresses = results ?? []
  const searchTerm = (propertyNameOrNumber ?? '').trim().toLowerCase()

  if (!searchTerm) {
    return addresses
  }

  return addresses.filter((result) =>
    matchesPropertyNameOrNumber(result, searchTerm)
  )
}

const buildLookupUrl = (postcode) => {
  const { apiUrl, maxResults } = config.get('addressLookup')
  const query = new URLSearchParams({
    postcode: normalisePostcode(postcode),
    maxresults: String(maxResults)
  })
  return `${apiUrl}?${query}`
}

// header.totalResults is how many the API has for the postcode; results is what it
// returned, capped at maxresults. The difference is what tells us the set is truncated.
const parseLookupResponse = ({ res, payload }) => {
  if (res?.statusCode === HTTP_STATUS_NO_CONTENT) {
    return { results: [], totalResults: 0 }
  }

  // json: true only parses when the content-type says JSON, so anything else - a proxy
  // error page served as a 200, an empty body - arrives as a raw buffer. Treat that as a
  // failure rather than reporting "no addresses found" for a search that never happened.
  if (Buffer.isBuffer(payload) || typeof payload !== 'object') {
    throw new TypeError('Address lookup response was not JSON')
  }

  const results = Array.isArray(payload?.results) ? payload.results : []

  return {
    results,
    totalResults: Number(payload?.header?.totalResults) || results.length
  }
}

const buildLookupHeaders = (token) => {
  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`
  }

  // Propagate the CDP tracing header, as authenticated-requests.js does for the backend.
  const traceId = getTraceId()
  if (traceId) {
    headers[config.get('tracing.header')] = traceId
  }

  return headers
}

const performLookup = (url, token) =>
  Wreck.get(url, {
    headers: buildLookupHeaders(token),
    json: true,
    timeout: config.get('addressLookup').timeout
  })

// Returns the lookup response, retrying once with a fresh token if the first
// attempt is rejected as unauthorised (the cached token was revoked or expired early).
const lookupWithTokenRetry = async (request, url) => {
  const token = await getAccessToken(request)

  if (!token) {
    return null
  }

  try {
    return await performLookup(url, token)
  } catch (error) {
    if (error.output?.statusCode !== HTTP_STATUS_UNAUTHORIZED) {
      throw error
    }

    request.logger.info(
      'Postcode lookup returned 401, refreshing the access token and retrying'
    )

    const refreshedToken = await getAccessToken(request, { forceRefresh: true })

    if (!refreshedToken) {
      return null
    }

    return performLookup(url, refreshedToken)
  }
}

const logLookupOutcome = (
  request,
  { propertyNameOrNumber, results, filtered, totalResults, truncated }
) => {
  const outcomeSummary =
    `resultCount=${results.length} filteredCount=${filtered.length} ` +
    `totalResults=${totalResults} truncated=${truncated} ` +
    `propertyFilterApplied=${Boolean(propertyNameOrNumber?.trim())}`

  request.logger.info(
    {
      event: { action: 'address-lookup-completed' },
      tenant: { message: outcomeSummary }
    },
    'Postcode lookup completed'
  )
}

export const lookupAddresses = async (
  request,
  { postcode, propertyNameOrNumber }
) => {
  const url = buildLookupUrl(postcode)

  try {
    const response = await lookupWithTokenRetry(request, url)

    if (!response) {
      return { results: [], error: true }
    }

    const { results, totalResults } = parseLookupResponse(response)

    // Filtering happens here because the API only searches by postcode, so a truncated
    // result set means a property search can miss an address that genuinely exists.
    // Flag it rather than reporting a confident "no addresses found".
    const filtered = filterByPropertyNameOrNumber(results, propertyNameOrNumber)
    const truncated = totalResults > results.length

    logLookupOutcome(request, {
      postcode,
      propertyNameOrNumber,
      results,
      filtered,
      totalResults,
      truncated
    })

    return {
      results: filtered,
      ...(truncated ? { truncated: true } : {})
    }
  } catch (error) {
    // apiUrl is in the context because a 404 here is almost always a misconfigured URL.
    request.logger.error(
      {
        event: { action: 'address-lookup-failed' },
        tenant: {
          message: `statusCode=${error.output?.statusCode} apiUrl=${config.get('addressLookup').apiUrl}`
        },
        err: error
      },
      'Postcode lookup request failed'
    )
    return { results: [], error: true }
  }
}
