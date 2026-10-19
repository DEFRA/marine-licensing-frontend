import {
  fetchConsultations,
  formatConsultationsForDisplay
} from '#src/server/marine-licence/consultations/utils.js'
import { validateConsulteeUserSession } from '#src/server/common/helpers/user-session-validators.js'

export const CONSULTATIONS_VIEW_ROUTE = 'marine-licence/consultations/index'

const CONSULTATIONS_PAGE_TITLE = 'Consultations'

export const consultationsController = {
  options: {
    pre: [validateConsulteeUserSession]
  },
  handler: async (request, h) => {
    try {
      const consultations = await fetchConsultations(request)

      return h.view(CONSULTATIONS_VIEW_ROUTE, {
        pageTitle: CONSULTATIONS_PAGE_TITLE,
        heading: CONSULTATIONS_PAGE_TITLE,
        consultations: formatConsultationsForDisplay(consultations)
      })
    } catch (error) {
      request.logger.error({ err: error }, 'Error fetching consultations')

      return h.view(CONSULTATIONS_VIEW_ROUTE, {
        pageTitle: CONSULTATIONS_PAGE_TITLE,
        heading: CONSULTATIONS_PAGE_TITLE,
        consultations: []
      })
    }
  }
}
