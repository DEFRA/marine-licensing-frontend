import {
  completionDateController,
  completionDateSubmitController
} from '#src/server/marine-licence/site-details/completion-date/controller.js'
import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'

export const completionDateRoutes = [
  {
    method: 'GET',
    path: marineLicenceRoutes.MARINE_LICENCE_COMPLETION_DATE,
    ...completionDateController
  },
  {
    method: 'POST',
    path: marineLicenceRoutes.MARINE_LICENCE_COMPLETION_DATE,
    ...completionDateSubmitController
  }
]
