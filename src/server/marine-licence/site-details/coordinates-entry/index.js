import {
  coordinatesEntryController,
  coordinatesEntrySubmitController
} from '#src/server/marine-licence/site-details/coordinates-entry/controller.js'
import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'

export const coordinatesEntryRoutes = [
  {
    method: 'GET',
    path: marineLicenceRoutes.MARINE_LICENCE_COORDINATES_ENTRY_CHOICE,
    ...coordinatesEntryController
  },
  {
    method: 'POST',
    path: marineLicenceRoutes.MARINE_LICENCE_COORDINATES_ENTRY_CHOICE,
    ...coordinatesEntrySubmitController
  }
]
