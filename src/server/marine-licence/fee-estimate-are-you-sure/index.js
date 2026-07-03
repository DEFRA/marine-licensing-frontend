import { feeEstimateAreYouSureController } from '#src/server/marine-licence/fee-estimate-are-you-sure/controller.js'
import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'

export const feeEstimateAreYouSureRoutes = [
  {
    method: 'GET',
    path: marineLicenceRoutes.MARINE_LICENCE_FEE_ESTIMATE_ARE_YOU_SURE,
    ...feeEstimateAreYouSureController
  }
]
