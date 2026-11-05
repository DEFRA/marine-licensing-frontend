import Boom from '@hapi/boom'
import { clearMarineLicenceCache } from '#src/server/common/helpers/marine-licence/session-cache/utils.js'
import { getUserSession } from '#src/server/common/plugins/auth/utils.js'
import {
  marineLicenceRoutes,
  routes
} from '#src/server/common/constants/routes.js'
import { errorMessages } from '#src/server/common/constants/error-messages.js'
import { getPaymentProblemContent } from '#src/server/marine-licence/payment/content.js'
import {
  getPaymentOutcome,
  redirectToPayment
} from '#src/server/marine-licence/payment/utils.js'

export const PAYMENT_PROBLEM_VIEW_ROUTE = 'marine-licence/payment/index'

export const paymentReturnController = {
  async handler(request, h) {
    const { returnId } = request.params
    const outcome = await getPaymentOutcome(request, returnId)

    if (outcome.applicationReference) {
      await clearMarineLicenceCache(request, h)
      return h.redirect(
        `${marineLicenceRoutes.MARINE_LICENCE_CONFIRMATION}?applicationReference=${encodeURIComponent(outcome.applicationReference)}`
      )
    }

    if (outcome.code) {
      request.logger.warn(
        `Payment for marine licence ${outcome.applicationId} not completed: ${outcome.status} (${outcome.code})`
      )
    }

    const content = getPaymentProblemContent(outcome)
    return h.view(PAYMENT_PROBLEM_VIEW_ROUTE, {
      pageTitle: content.heading,
      ...content,
      retryUrl: `${marineLicenceRoutes.MARINE_LICENCE_PAYMENT_RETRY}/${returnId}`,
      dashboardUrl: routes.DASHBOARD
    })
  }
}

export const paymentRetryController = {
  async handler(request, h) {
    const { returnId } = request.params
    const { displayName, email } = await getUserSession(
      request,
      request.state?.userSession
    )

    if (!displayName || !email) {
      throw Boom.unauthorized(errorMessages.USER_SESSION_NOT_FOUND)
    }

    const outcome = await getPaymentOutcome(request, returnId)

    if (outcome.applicationReference) {
      return h.redirect(
        `${marineLicenceRoutes.MARINE_LICENCE_CONFIRMATION}?applicationReference=${encodeURIComponent(outcome.applicationReference)}`
      )
    }

    return redirectToPayment(request, h, {
      id: outcome.applicationId,
      userName: displayName,
      userEmail: email
    })
  }
}
