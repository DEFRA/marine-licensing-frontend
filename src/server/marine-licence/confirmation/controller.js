import Boom from '@hapi/boom'
import { getMarineLicenceCache } from '#src/server/common/helpers/marine-licence/session-cache/utils.js'

const CONFIRMATION_VIEW_ROUTE = 'marine-licence/confirmation/index'

const confirmationViewContent = {
  pageTitle: 'Application sent'
}

export const confirmationController = {
  handler(request, h) {
    getMarineLicenceCache(request)
    const { applicationReference } = request.query

    if (!applicationReference) {
      throw Boom.badRequest('Missing application reference number')
    }

    return h.view(CONFIRMATION_VIEW_ROUTE, {
      ...confirmationViewContent,
      applicationReference
    })
  }
}
