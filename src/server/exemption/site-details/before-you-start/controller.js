import { EXEMPTIONS_KEY } from '#src/server/common/constants/exemptions.js'
import {
  clearSavedSiteDetails,
  getExemptionCache
} from '#src/server/common/helpers/exemptions/session-cache/utils.js'

export const BEFORE_YOU_START_SITE_DETAILS_VIEW_ROUTE =
  'templates/before-you-start'

const beforeYouStartSettings = {
  pageTitle: 'Site details',
  heading: 'Site details'
}
export const beforeYouStartController = {
  async handler(request, h) {
    const exemption = getExemptionCache(request)

    await clearSavedSiteDetails(request, h)

    return h.view(BEFORE_YOU_START_SITE_DETAILS_VIEW_ROUTE, {
      ...beforeYouStartSettings,
      projectName: exemption.projectName,
      projectType: EXEMPTIONS_KEY
    })
  }
}
