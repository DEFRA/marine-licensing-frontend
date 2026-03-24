import { MARINE_LICENCE_KEY } from '#src/server/common/constants/marine-licence.js'
import {
  clearMarineLicenceCache,
  getMarineLicenceCache
} from '#src/server/common/helpers/marine-licence/session-cache/utils.js'

export const BEFORE_YOU_START_SITE_DETAILS_VIEW_ROUTE =
  'templates/before-you-start'

const beforeYouStartSettings = {
  pageTitle: 'Site details',
  heading: 'Site details'
}
export const beforeYouStartController = {
  async handler(request, h) {
    const marineLicence = getMarineLicenceCache(request)

    await clearMarineLicenceCache(request, h)

    return h.view(BEFORE_YOU_START_SITE_DETAILS_VIEW_ROUTE, {
      ...beforeYouStartSettings,
      projectName: marineLicence.projectName,
      projectType: MARINE_LICENCE_KEY
    })
  }
}
