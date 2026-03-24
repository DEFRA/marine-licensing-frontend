import {
  clearSavedMarineLicenceSiteDetails,
  getMarineLicenceCache
} from '#src/server/common/helpers/marine-licence/session-cache/utils.js'
import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'

export const BEFORE_YOU_START_SITE_DETAILS_VIEW_ROUTE =
  'templates/before-you-start'

const beforeYouStartSettings = {
  backLink: marineLicenceRoutes.MARINE_LICENCE_TASK_LIST,
  cancelLink: `${marineLicenceRoutes.MARINE_LICENCE_TASK_LIST}?cancel=site-details`,
  continueLink: marineLicenceRoutes.MARINE_LICENCE_SITE_DETAILS,
  pageTitle: 'Site details',
  heading: 'Site details',
  isMarineLicence: true
}
export const beforeYouStartController = {
  async handler(request, h) {
    const marineLicence = getMarineLicenceCache(request)

    await clearSavedMarineLicenceSiteDetails(request, h)

    return h.view(BEFORE_YOU_START_SITE_DETAILS_VIEW_ROUTE, {
      ...beforeYouStartSettings,
      projectName: marineLicence.projectName
    })
  }
}
