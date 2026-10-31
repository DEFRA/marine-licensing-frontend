import {
  authenticatedGetRequest,
  authenticatedPostRequest
} from '#src/server/common/helpers/authenticated-requests.js'
import { apiRoutes } from '#src/server/common/constants/routes.js'
import { errorMessages } from '#src/server/common/constants/error-messages.js'

export const redirectToPayment = async (
  request,
  h,
  { id, userName, userEmail }
) => {
  const { payload: response } = await authenticatedPostRequest(
    request,
    apiRoutes.MARINE_LICENCE_PAYMENT,
    { id, userName, userEmail }
  )

  const nextUrl = response?.value?.nextUrl
  if (response?.message !== 'success' || !nextUrl) {
    throw new Error(errorMessages.UNEXPECTED_API_RESPONSE)
  }

  return h.redirect(nextUrl)
}

export const getPaymentOutcome = async (request, returnId) => {
  const { payload: response } = await authenticatedGetRequest(
    request,
    `${apiRoutes.MARINE_LICENCE_PAYMENT}/${encodeURIComponent(returnId)}`
  )

  if (response?.message !== 'success' || !response?.value) {
    throw new Error(errorMessages.UNEXPECTED_API_RESPONSE)
  }

  return response.value
}
