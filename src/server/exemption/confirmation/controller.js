import Boom from '@hapi/boom'
import { getExemptionCache } from '#src/server/common/helpers/session-cache/utils.js'

const confirmationViewContent = {
  title: 'Application complete - Defra SDLC Governance Checklist',
  description: 'Your exemption application has been submitted successfully.'
}

const CONFIRMATION_VIEW_ROUTE = 'exemption/confirmation/index'
export const confirmationController = {
  handler(request, h) {
    const exemption = getExemptionCache(request)
    const { applicationReference } = request.query

    // Validate that we have a reference number
    if (!applicationReference) {
      throw Boom.badRequest('Missing application reference number')
    }

    return h.view(CONFIRMATION_VIEW_ROUTE, {
      ...confirmationViewContent,
      applicationReference,
      ...exemption
    })
  }
}
