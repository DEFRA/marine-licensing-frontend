import { config } from '#src/config/config.js'

export const isUserReferredFromDefraAccount = (request) => {
  const { accountManagementUrl } = config.get('defraId')

  const referer = request.headers.referer

  return Boolean(referer?.startsWith(accountManagementUrl))
}

export const isUserReferredFromSignIn = (request) => {
  const referer = request.headers.referer

  return Boolean(referer?.includes('/signin-oidc'))
}
