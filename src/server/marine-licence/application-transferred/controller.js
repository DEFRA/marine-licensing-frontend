import Boom from '@hapi/boom'
import {
  marineLicenceRoutes,
  routes
} from '#src/server/common/constants/routes.js'
import { MCMS_LOGIN_URL } from '#src/server/common/constants/mcms.js'
import { getMarineLicenceService } from '#src/services/marine-licence-service/index.js'
import { PROJECT_STATUS } from '#src/server/common/constants/projects.js'

export const APPLICATION_TRANSFERRED_VIEW_ROUTE =
  'marine-licence/application-transferred/index'

export const CONTACT_EMAIL = 'marine.consents@marinemanagement.org.uk'

export const CONTACT_PHONE = '0191 376 2791'

const pageTitle = 'Your application has been transferred'

const applicationTransferredSettings = {
  pageTitle,
  heading: pageTitle,
  mcmsLoginUrl: MCMS_LOGIN_URL,
  contactEmail: CONTACT_EMAIL,
  contactPhone: CONTACT_PHONE,
  backLink: routes.DASHBOARD
}

export const applicationTransferredController = {
  async handler(request, h) {
    const { marineLicenceId } = request.params

    try {
      const service = getMarineLicenceService(request)
      const marineLicence = await service.getMarineLicenceById(marineLicenceId)

      if (marineLicence.status !== PROJECT_STATUS.TRANSFERRED) {
        return h.redirect(routes.DASHBOARD)
      }

      return h.view(APPLICATION_TRANSFERRED_VIEW_ROUTE, {
        ...applicationTransferredSettings,
        projectName: marineLicence.projectName,
        applicationReference: marineLicence.applicationReference,
        viewDetailsUrl: `${marineLicenceRoutes.MARINE_LICENCE_VIEW_DETAILS}/${marineLicenceId}`
      })
    } catch (error) {
      if (error.isBoom) {
        throw error
      }

      request.logger.error(
        error,
        'Error displaying application transferred page'
      )
      throw Boom.internal('Error displaying application transferred page')
    }
  }
}
