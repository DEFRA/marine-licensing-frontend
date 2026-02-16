const CACHE_PARENT_KEY = 'defraIdGuidance'

export const defraIdGuidanceUserSession = {
  set: async ({ request, key, value }) => {
    const existing = (await request.yar.get(CACHE_PARENT_KEY)) || {}
    request.yar.set(CACHE_PARENT_KEY, { ...existing, [key]: value })
  },
  get: async ({ request, key }) => {
    const guidance = await request.yar.get(CACHE_PARENT_KEY)
    return guidance ? guidance[key] || null : null
  },
  clear: (request) => {
    request.yar.clear(CACHE_PARENT_KEY)
  }
}
