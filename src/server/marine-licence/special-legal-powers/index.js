import {
  specialLegalPowersController,
  specialLegalPowersSubmitController
} from '#src/server/marine-licence/special-legal-powers/controller.js'
import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'
export const specialLegalPowersRoutes = [
  {
    method: 'GET',
    path: marineLicenceRoutes.MARINE_LICENCE_SPECIAL_LEGAL_POWERS,
    ...specialLegalPowersController
  },
  {
    method: 'POST',
    path: marineLicenceRoutes.MARINE_LICENCE_SPECIAL_LEGAL_POWERS,
    ...specialLegalPowersSubmitController
  }
]
