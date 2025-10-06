import {
  coordinatesEntryController,
  coordinatesEntrySubmitController
} from '#src/server/exemption/site-details/coordinates-entry/controller.js'
import { routes } from '#src/server/common/constants/routes.js'
export const coordinatesEntryRoutes = [
  {
    method: 'GET',
    path: routes.COORDINATES_ENTRY_CHOICE,
    ...coordinatesEntryController
  },
  {
    method: 'POST',
    path: routes.COORDINATES_ENTRY_CHOICE,
    ...coordinatesEntrySubmitController
  }
]
