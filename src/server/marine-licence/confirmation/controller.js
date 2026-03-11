import Boom from '@hapi/boom'

const CONFIRMATION_VIEW_ROUTE = 'marine-licence/confirmation/index'

const confirmationViewContent = {
  pageTitle: 'Application sent'
}

export const confirmationController = {
  handler(request, h) {
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
