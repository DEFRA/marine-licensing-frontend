const GUIDANCE_CACHE_PARENT_KEY = 'defraIdGuidance'
const POST_LOGIN_CACHE_PARENT_KEY = 'defraIdPostLogin'

const loginCache = (CACHE_PARENT_KEY) => ({
  set: async ({ request, key, value }) => {
    const existing = (await request.yar.get(CACHE_PARENT_KEY)) || {}
    request.yar.set(CACHE_PARENT_KEY, { ...existing, [key]: value })
  },
  get: async ({ request, key }) => {
    const login = await request.yar.get(CACHE_PARENT_KEY)
    return login ? login[key] || null : null
  },
  clear: (request) => {
    request.yar.clear(CACHE_PARENT_KEY)
  }
})

export const defraIdGuidanceUserSession = loginCache(GUIDANCE_CACHE_PARENT_KEY)
export const postloginUserSession = loginCache(POST_LOGIN_CACHE_PARENT_KEY)
