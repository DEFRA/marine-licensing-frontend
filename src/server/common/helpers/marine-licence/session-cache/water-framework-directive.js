import {
  getMarineLicenceCache,
  MARINE_LICENCE_CACHE_KEY
} from '#src/server/common/helpers/marine-licence/session-cache/utils.js'
import { WFD_RETURN_TO_KEY } from '#src/server/common/constants/cache.js'

export const updateWaterFrameworkDirective = async (request, h, key, value) => {
  const existingCache = getMarineLicenceCache(request)
  const existingWaterFrameworkDirective =
    existingCache.waterFrameworkDirective || {}
  const cacheValue = value ?? null

  const updatedWaterFrameworkDirective = {
    ...existingWaterFrameworkDirective,
    [key]: cacheValue
  }

  if (cacheValue === null) {
    delete updatedWaterFrameworkDirective[key]
  }

  request.yar.set(MARINE_LICENCE_CACHE_KEY, {
    ...existingCache,
    waterFrameworkDirective: updatedWaterFrameworkDirective
  })

  await request.yar.commit(h)

  return { [key]: cacheValue }
}

export const setWaterFrameworkDirectiveReturnToCache = async (
  request,
  h,
  returnPath
) => {
  request.yar.clear(WFD_RETURN_TO_KEY)
  request.yar.set(WFD_RETURN_TO_KEY, returnPath)
  await request.yar.commit(h)
}

export const clearWaterFrameworkDirectiveReturnToCache = (request) => {
  request.yar.clear(WFD_RETURN_TO_KEY)
}

export const getWaterFrameworkDirectiveReturnRoute = (request) =>
  request.yar.get(WFD_RETURN_TO_KEY)
