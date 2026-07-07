import {
  harbourAuthorityController,
  harbourAuthoritySubmitController
} from '#src/server/marine-licence/harbour-authority/controller.js'
import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'

export const harbourAuthorityRoutes = [
  {
    method: 'GET',
    path: marineLicenceRoutes.MARINE_LICENCE_HARBOUR_AUTHORITY,
    ...harbourAuthorityController
  },
  {
    method: 'POST',
    path: marineLicenceRoutes.MARINE_LICENCE_HARBOUR_AUTHORITY,
    ...harbourAuthoritySubmitController
  }
]
