import {
  clearSavedSiteDetails,
  getExemptionCache
} from '#src/server/common/helpers/exemptions/session-cache/utils.js'
import { routes } from '#src/server/common/constants/routes.js'

export const BEFORE_YOU_START_SITE_DETAILS_VIEW_ROUTE =
  'templates/before-you-start'

const beforeYouStartSettings = {
  backLink: routes.TASK_LIST,
  cancelLink: `${routes.TASK_LIST}?cancel=site-details`,
  continueLink: routes.COORDINATES_TYPE_CHOICE,
  pageTitle: 'Site details',
  heading: 'Site details',
  isExemption: true
}
export const beforeYouStartController = {
  async handler(request, h) {
    const exemption = getExemptionCache(request)

    await clearSavedSiteDetails(request, h)

    return h.view(BEFORE_YOU_START_SITE_DETAILS_VIEW_ROUTE, {
      ...beforeYouStartSettings,
      projectName: exemption.projectName
    })
  }
}
