import { RETURN_TO_CACHE_KEY } from '#src/server/common/constants/cache.js'

/**
 * Stores a return path in session so users can navigate back from change flows.
 *
 * RETURN_TO_CACHE_KEY is written in two forms:
 * - flash: consumed by site-details and other one-time redirect handlers
 * - session value: read non-destructively by WFD pages for back links and continue
 */
export const setReturnToCache = async (request, h, returnPath) => {
  request.yar.clear(RETURN_TO_CACHE_KEY)
  request.yar.flash(RETURN_TO_CACHE_KEY, returnPath, true)
  request.yar.set(RETURN_TO_CACHE_KEY, returnPath)
  await request.yar.commit(h)
}

/**
 * Clears both flash and session values for RETURN_TO_CACHE_KEY.
 */
export const clearReturnToCache = (request) => {
  request.yar.flash(RETURN_TO_CACHE_KEY)
  request.yar.clear(RETURN_TO_CACHE_KEY)
}
