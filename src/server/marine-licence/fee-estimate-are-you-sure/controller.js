import { getMarineLicenceCache } from '#src/server/common/helpers/marine-licence/session-cache/utils.js'
import {
  marineLicenceRoutes,
  routes
} from '#src/server/common/constants/routes.js'

export const FEE_ESTIMATE_ARE_YOU_SURE_VIEW_ROUTE =
  'marine-licence/fee-estimate-are-you-sure/index'

const pageTitle = 'Are you sure you do not accept the fee estimate?'

const feeEstimateAreYouSureSettings = {
  pageTitle,
  heading: pageTitle,
  warningText:
    'If you do not accept the fee estimate you will not be able to submit your application.',
  bodyText:
    'The information provided will be saved as a draft in this account. You can come back later to accept the fee estimate if you need to submit your application.',
  backLink: marineLicenceRoutes.MARINE_LICENCE_FEE_ESTIMATE,
  cancelLink: marineLicenceRoutes.MARINE_LICENCE_FEE_ESTIMATE,
  finishLink: routes.DASHBOARD
}

export const feeEstimateAreYouSureController = {
  async handler(request, h) {
    const marineLicence = getMarineLicenceCache(request)

    return h.view(FEE_ESTIMATE_ARE_YOU_SURE_VIEW_ROUTE, {
      ...feeEstimateAreYouSureSettings,
      projectName: marineLicence.projectName
    })
  }
}
