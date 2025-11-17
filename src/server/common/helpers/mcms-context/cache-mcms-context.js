import { paramsSchema } from './schema.js'

const mcmsContextCacheKey = 'mcmsContext'

export const cacheMcmsContextFromQueryParams = (request) => {
  if (request.path === '/') {
    const { error, value } = paramsSchema.validate(request.query)
    const iatQueryString = request.raw?.req?.url.substring(1)
    if (error) {
      request.logger.info(
        `Missing or invalid MCMS query string context on URL: ${request.url} - ${error.message}`
      )
      if (Object.keys(request.query).length) {
        request.yar.flash(mcmsContextCacheKey, {
          iatQueryString
        })
      }
    } else {
      request.yar.flash(mcmsContextCacheKey, { ...value, iatQueryString })
    }
  }
}

export const getMcmsContextFromCache = (request) => {
  const cachedParams = request.yar.flash(mcmsContextCacheKey)
  if (!cachedParams?.length) {
    request.logger.info(`No MCMS context cached for URL: ${request.url}`)
    return null
  }
  if (cachedParams.length > 1) {
    request.logger.info(`Multiple MCMS contexts cached for URL: ${request.url}`)
  }
  return cachedParams[0]
}
