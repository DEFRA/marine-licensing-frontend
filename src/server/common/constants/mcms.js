import { config } from '#src/config/config.js'

const MCMS_LOGIN_PATH = 'mmofox5/fox/live/MMO_LOGIN/login'

export const MCMS_LOGIN_URL = new URL(
  MCMS_LOGIN_PATH,
  config.get('mcms.url')
).toString()
