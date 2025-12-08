import { paramsSchema } from './schema.js'

const mcmsContextCacheKey = 'mcmsContext'

export const cacheMcmsContextFromQueryParams = (request) => {
  if (request.path === '/') {
    request.logger.info(`Root path / hit with querystring: ${request.url}`)
    const { error, value } = paramsSchema.validate(request.query)
    const iatQueryString = request.raw?.req?.url.substring(1)
    if (error) {
      request.logger.info(
        `Missing or invalid MCMS query string context on URL: ${request.url} - ${error.message}`
      )
      if (Object.keys(request.query).length) {
        request.yar.set(mcmsContextCacheKey, {
          iatQueryString
        })
      }
    } else {
      request.yar.set(mcmsContextCacheKey, { ...value, iatQueryString })
    }
  }
}

export const getMcmsContextFromCache = (request) => {
  const cachedParams = request.yar.get(mcmsContextCacheKey)
  request.logger.info(
    `getMcmsContextFromCache: ${JSON.stringify(cachedParams)}`
  )
  if (!cachedParams) {
    return null
  }
  return cachedParams
}

export const clearMcmsContextCache = (request) => {
  request.yar.clear(mcmsContextCacheKey)
}
