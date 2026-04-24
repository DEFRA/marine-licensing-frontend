import {
  selectActivityController,
  selectActivitySubmitController
} from '#src/server/marine-licence/site-details/select-activity/controller.js'
import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'

export const selectActivityRoutes = [
  {
    method: 'GET',
    path: marineLicenceRoutes.MARINE_LICENCE_SELECT_ACTIVITY,
    ...selectActivityController
  },
  {
    method: 'POST',
    path: marineLicenceRoutes.MARINE_LICENCE_SELECT_ACTIVITY,
    ...selectActivitySubmitController
  }
]
