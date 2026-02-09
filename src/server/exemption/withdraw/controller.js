import { authenticatedPostRequest } from '#src/server/common/helpers/authenticated-requests.js'
import { routes } from '#src/server/common/constants/routes.js'
import {
  getExemptionCache,
  setExemptionCache,
  clearExemptionCache
} from '#src/server/common/helpers/exemptions/session-cache/utils.js'
import Boom from '@hapi/boom'
import { EXEMPTION_TYPE } from '#src/server/common/constants/exemptions.js'
import { getExemptionService } from '#src/services/exemption-service/index.js'

export const WITHDRAW_EXEMPTION_VIEW_ROUTE = 'exemption/withdraw/index'
const WITHDRAW_EXEMPTION_PAGE_TITLE =
  'Are you sure you want to withdraw this project?'

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
            formExemptionId: exemptionId,
            cachedExemptionId
          },
          'Exemption ID mismatch or missing'
        )
        return h.redirect(routes.DASHBOARD)
      }

      await authenticatedPostRequest(
        request,
        `/exemption/${exemptionId}/withdraw`,
        {}
      )

      request.logger.info({ exemptionId }, `Withdrawn exemption ${exemptionId}`)

      await clearExemptionCache(request, h)

      return h.redirect(routes.DASHBOARD)
    } catch (error) {
      request.logger.error({ err: error }, 'Error withdrawing exemption')
      return h.redirect(routes.DASHBOARD)
    }
  }
}
