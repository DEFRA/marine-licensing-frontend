import { clone } from '@hapi/hoek'

const EXEMPTION_CACHE_KEY = 'exemption'

export const getExemptionCache = (request) => {
  return clone(request.yar.get(EXEMPTION_CACHE_KEY) || {})
}

export const setExemptionCache = (request, value) => {
  request.yar.set(EXEMPTION_CACHE_KEY, value)
  return value
}
