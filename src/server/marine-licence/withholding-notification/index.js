import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'
import {
  withholdingNotificationController,
  withholdingNotificationSubmitController
} from '#src/server/marine-licence/withholding-notification/controller.js'

export const withholdingNotificationRoutes = [
  {
    method: 'GET',
    path: `${marineLicenceRoutes.MARINE_LICENCE_WITHHOLDING_NOTIFICATION}/{marineLicenceId}`,
    ...withholdingNotificationController
  },
  {
    method: 'POST',
    path: marineLicenceRoutes.MARINE_LICENCE_WITHHOLDING_NOTIFICATION,
    ...withholdingNotificationSubmitController
  }
]
