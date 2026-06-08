import {
  getMarineLicenceCache,
  MARINE_LICENCE_CACHE_KEY
} from '#src/server/common/helpers/marine-licence/session-cache/utils.js'

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
