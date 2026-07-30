import {
  confirmChangeActivityTypeController,
  confirmChangeActivityTypeSubmitController
} from '#src/server/marine-licence/site-details/confirm-change-activity-type/controller.js'
import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'

export const confirmChangeActivityTypeRoutes = [
  {
    method: 'GET',
    path: marineLicenceRoutes.MARINE_LICENCE_CONFIRM_CHANGE_ACTIVITY_TYPE,
    ...confirmChangeActivityTypeController
  },
  {
    method: 'POST',
    path: marineLicenceRoutes.MARINE_LICENCE_CONFIRM_CHANGE_ACTIVITY_TYPE,
    ...confirmChangeActivityTypeSubmitController
  }
]
