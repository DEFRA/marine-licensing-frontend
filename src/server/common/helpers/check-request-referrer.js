import { config } from '#src/config/config.js'

export const isUserReferredFromDefraAccount = (request) => {
  const { accountManagementUrl } = config.get('defraId')

  const referer = request.headers.referer

  const result = Boolean(referer?.startsWith(accountManagementUrl))
  if (result) {
    request.logger.info(
      `User has come from Defra account. Referer header: ${request.headers.referer}`
    )
  }
  return result
}

export const isUserReferredFromSignIn = (request) => {
  const referer = request.headers.referer

  const result = Boolean(referer?.includes('/signin-oidc'))
  if (result) {
    request.logger.info(
      `User has come from signin. Referer header: ${request.headers.referer}`
    )
  }
  return result
}
