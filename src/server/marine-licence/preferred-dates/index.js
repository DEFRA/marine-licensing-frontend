import {
  preferredDatesController,
  preferredDatesSubmitController
} from '#src/server/marine-licence/preferred-dates/controller.js'
import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'

export const preferredDatesRoutes = [
  {
    method: 'GET',
    path: marineLicenceRoutes.MARINE_LICENCE_PREFERRED_DATES,
    ...preferredDatesController
  },
  {
    method: 'POST',
    path: marineLicenceRoutes.MARINE_LICENCE_PREFERRED_DATES,
    ...preferredDatesSubmitController
  }
]
