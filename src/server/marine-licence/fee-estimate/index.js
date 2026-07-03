import {
  feeEstimateController,
  feeEstimateSubmitController
} from '#src/server/marine-licence/fee-estimate/controller.js'
import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'

export const feeEstimateRoutes = [
  {
    method: 'GET',
    path: marineLicenceRoutes.MARINE_LICENCE_FEE_ESTIMATE,
    ...feeEstimateController
  },
  {
    method: 'POST',
    path: marineLicenceRoutes.MARINE_LICENCE_FEE_ESTIMATE,
    ...feeEstimateSubmitController
  }
]
