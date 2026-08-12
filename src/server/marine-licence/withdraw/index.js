import {
  withdrawMarineLicenceConfirmController,
  withdrawMarineLicenceSelectController,
  withdrawMarineLicenceSubmitController
} from '#src/server/marine-licence/withdraw/controller.js'
import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'

export const withdrawMarineLicenceRoutes = [
  {
    method: 'GET',
    path: marineLicenceRoutes.MARINE_LICENCE_WITHDRAW,
    ...withdrawMarineLicenceConfirmController
  },
  {
    method: 'GET',
    path: `${marineLicenceRoutes.MARINE_LICENCE_WITHDRAW}/{marineLicenceId}`,
    ...withdrawMarineLicenceSelectController
  },
  {
    method: 'POST',
    path: marineLicenceRoutes.MARINE_LICENCE_WITHDRAW,
    ...withdrawMarineLicenceSubmitController
  }
]
