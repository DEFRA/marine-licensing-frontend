import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'
import {
  deleteActivityController,
  deleteActivitySubmitController
} from '#src/server/marine-licence/site-details/delete-activity/controller.js'

export const deleteActivityRoutes = [
  {
    method: 'GET',
    path: marineLicenceRoutes.MARINE_LICENCE_DELETE_ACTIVITY,
    ...deleteActivityController
  },
  {
    method: 'POST',
    path: marineLicenceRoutes.MARINE_LICENCE_DELETE_ACTIVITY,
    ...deleteActivitySubmitController
  }
]
