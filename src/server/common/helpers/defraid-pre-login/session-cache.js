const CACHE_PARENT_KEY = 'defraIdPreLogin'

export const preloginUserSession = {
  set: async ({ request, key, value }) => {
    const existing = (await request.yar.get(CACHE_PARENT_KEY)) || {}
    request.yar.set(CACHE_PARENT_KEY, { ...existing, [key]: value })
  },
  get: async ({ request, key }) => {
    const preLogin = await request.yar.get(CACHE_PARENT_KEY)
    return preLogin ? preLogin[key] || null : null
  }
}
