import {
  updateAndResubmitController,
  updateAndResubmitSubmitController
} from '#src/server/marine-licence/update-and-resubmit/controller.js'
import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'

export const updateAndResubmitRoutes = [
  {
    method: 'GET',
    path: `${marineLicenceRoutes.MARINE_LICENCE_UPDATE_AND_RESUBMIT}/{marineLicenceId}`,
    ...updateAndResubmitController
  },
  {
    method: 'POST',
    path: `${marineLicenceRoutes.MARINE_LICENCE_UPDATE_AND_RESUBMIT}/{marineLicenceId}`,
    ...updateAndResubmitSubmitController
  }
]
