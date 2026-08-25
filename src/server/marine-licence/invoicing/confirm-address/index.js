import {
  confirmAddressController,
  confirmAddressSubmitController
} from '#src/server/marine-licence/invoicing/confirm-address/controller.js'
import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'

export const confirmAddressRoutes = [
  {
    method: 'GET',
    path: marineLicenceRoutes.MARINE_LICENCE_CONFIRM_ADDRESS,
    ...confirmAddressController
  },
  {
    method: 'POST',
    path: marineLicenceRoutes.MARINE_LICENCE_CONFIRM_ADDRESS,
    ...confirmAddressSubmitController
  }
]
