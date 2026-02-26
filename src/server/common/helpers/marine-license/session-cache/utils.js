import { clone } from '@hapi/hoek'

export const MARINE_LICENSE_CACHE_KEY = 'marineLicense'

export const clearMarineLicenseCache = async (request, h) => {
  request.yar.clear(MARINE_LICENSE_CACHE_KEY)
  await request.yar.commit(h)
}

export const getMarineLicenseCache = (request) => {
  return clone(request.yar.get(MARINE_LICENSE_CACHE_KEY) || {})
}

export const setMarineLicenseCache = async (request, h, value) => {
  const cacheValue = value || {}
  request.yar.set(MARINE_LICENSE_CACHE_KEY, cacheValue)

  await request.yar.commit(h)

  return cacheValue
}
