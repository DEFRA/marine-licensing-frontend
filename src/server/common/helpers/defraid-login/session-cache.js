const PRE_LOGIN_CACHE_PARENT_KEY = 'defraIdPreLogin'
const POST_LOGIN_CACHE_PARENT_KEY = 'defraIdPostLogin'

const loginCache = (CACHE_PARENT_KEY) => ({
  set: async ({ request, key, value }) => {
    const existing = (await request.yar.get(CACHE_PARENT_KEY)) || {}
    request.yar.set(CACHE_PARENT_KEY, { ...existing, [key]: value })
  },
  get: async ({ request, key }) => {
    const preLogin = await request.yar.get(CACHE_PARENT_KEY)
    return preLogin ? preLogin[key] || null : null
  }
})

export const preloginUserSession = loginCache(PRE_LOGIN_CACHE_PARENT_KEY)
export const postloginUserSession = loginCache(POST_LOGIN_CACHE_PARENT_KEY)
