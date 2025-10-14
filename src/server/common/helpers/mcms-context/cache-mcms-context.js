import { paramsSchema } from './schema.js'

const mcmsContextCacheKey = 'mcmsContext'

export const cacheMcmsContextFromQueryParams = (request) => {
  if (request.path === '/') {
    const { error, value } = paramsSchema.validate(request.query)

    if (error) {
      request.logger.error(
        error,
        `Missing or invalid MCMS query string context on URL: ${request.url} - ${error.message}`
      )
    } else {
      request.yar.flash(mcmsContextCacheKey, value)
    }
  }
}

export const getMcmsContextFromCache = (request) => {
  const cachedParams = request.yar.flash(mcmsContextCacheKey)
  if (!cachedParams?.length) {
    request.logger.error(
      `Missing MCMS query string context on URL: ${request.url}`
    )
    return null
  }
  if (cachedParams.length > 1) {
    request.logger.error(
      `Multiple MCMS contexts cached for URL: ${request.url}`
    )
  }

  return cachedParams[0]
}
