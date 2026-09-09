import { authenticatedPostRequest } from '#src/server/common/helpers/authenticated-requests.js'
import { routes } from '#src/server/common/constants/routes.js'
import {
  getExemptionCache,
  setExemptionCache,
  clearExemptionCache
} from '#src/server/common/helpers/exemptions/session-cache/utils.js'
import Boom from '@hapi/boom'
import { EXEMPTION_TYPE } from '#src/server/common/constants/exemptions.js'
import { WITHDRAWABLE_EXEMPTION_STATUSES } from '#src/server/common/constants/projects.js'
import { statusCodes } from '#src/server/common/constants/status-codes.js'
import { getExemptionService } from '#src/services/exemption-service/index.js'

export const WITHDRAW_EXEMPTION_VIEW_ROUTE = 'exemption/withdraw/index'
const WITHDRAW_EXEMPTION_PAGE_TITLE =
  'Are you sure you want to withdraw this project?'

// The activity period can end between the confirmation page being rendered and
// the user confirming, so the backend is the final authority on withdrawability.
const WITHDRAW_CONFLICT_MESSAGE =
  'This project can no longer be withdrawn because its activity period has ended'

export const withdrawExemptionController = {
  handler: async (request, h) => {
    const exemption = getExemptionCache(request)
    const { id: exemptionId } = exemption

    if (!exemptionId) {
      throw Boom.notFound('Exemption not found')
    }

    try {
      const exemptionService = getExemptionService(request)
      const savedExemption =
        await exemptionService.getExemptionById(exemptionId)

      if (!savedExemption) {
        return h.redirect(routes.DASHBOARD)
      }

      if (!WITHDRAWABLE_EXEMPTION_STATUSES.includes(savedExemption.status)) {
        request.logger.warn(
          {
            event: {
              action: 'exemption-withdraw:not-withdrawable',
              outcome: 'failure',
              reference: exemptionId,
              reason:
                'Activity period has ended or the exemption is already withdrawn'
            }
          },
          `Exemption ${exemptionId} cannot be withdrawn: status ${savedExemption.status}`
        )
        return h.redirect(routes.DASHBOARD)
      }

      return h.view(WITHDRAW_EXEMPTION_VIEW_ROUTE, {
        pageTitle: WITHDRAW_EXEMPTION_PAGE_TITLE,
        heading: WITHDRAW_EXEMPTION_PAGE_TITLE,
        projectName: savedExemption.projectName,
        exemptionType: EXEMPTION_TYPE,
        exemptionId,
        backLink: routes.DASHBOARD,
        routes
      })
    } catch (error) {
      request.logger.error(
        { err: error },
        'Error fetching project for withdraw'
      )

      return h.redirect(routes.DASHBOARD)
    }
  }
}

export const withdrawExemptionSelectController = {
  async handler(request, h) {
    const { exemptionId } = request.params
    await clearExemptionCache(request, h)
    await setExemptionCache(request, h, { id: exemptionId })
    return h.redirect(routes.WITHDRAW_EXEMPTION)
  }
}

export const withdrawExemptionSubmitController = {
  handler: async (request, h) => {
    try {
      const { exemptionId } = request.payload
      const exemption = getExemptionCache(request)
      const { id: cachedExemptionId } = exemption

      if (!exemptionId || exemptionId !== cachedExemptionId) {
        request.logger.error(
          {
            event: {
              action: 'exemption-withdraw:id-mismatch',
              outcome: 'failure',
              reference: cachedExemptionId,
              reason:
                'The exemption ID submitted with the withdrawal form did not match the cached exemption ID'
            }
          },
          `Exemption withdrawal rejected: form ID ${exemptionId} does not match cached ID ${cachedExemptionId}`
        )
        return h.redirect(routes.DASHBOARD)
      }

      await authenticatedPostRequest(
        request,
        `/exemption/${exemptionId}/withdraw`,
        {}
      )

      request.logger.info(`Withdrawn exemption ${exemptionId}`)

      await clearExemptionCache(request, h)

      return h.redirect(routes.DASHBOARD)
    } catch (error) {
      if (error.output?.statusCode === statusCodes.conflict) {
        request.logger.warn(
          { err: error },
          'Exemption can no longer be withdrawn'
        )
        throw Boom.conflict(WITHDRAW_CONFLICT_MESSAGE)
      }

      request.logger.error({ err: error }, 'Error withdrawing exemption')
      return h.redirect(routes.DASHBOARD)
    }
  }
}
