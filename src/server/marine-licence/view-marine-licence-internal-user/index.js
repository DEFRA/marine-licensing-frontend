import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'
import { viewDetailsInternalUserController } from '#src/server/marine-licence/view-marine-licence-internal-user/controller.js'
import { saveRedactionController } from '#src/server/marine-licence/view-marine-licence-internal-user/redaction-controller.js'

export const viewMarineLicenceInternalUserRoutes = [
  {
    method: 'GET',
    path: `${marineLicenceRoutes.MARINE_LICENCE_VIEW_DETAILS_INTERNAL_USER}/{marineLicenceId}`,
    ...viewDetailsInternalUserController
  },
  {
    method: 'POST',
    path: `${marineLicenceRoutes.MARINE_LICENCE_VIEW_DETAILS_INTERNAL_USER}/{marineLicenceId}/redact`,
    ...saveRedactionController
  }
]
