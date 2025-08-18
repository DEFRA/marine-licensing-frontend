import { getExemptionCache } from '~/src/server/common/helpers/session-cache/utils.js'

export const BEFORE_YOU_START_SITE_DETAILS_VIEW_ROUTE =
  'exemption/site-details/before-you-start/index'

const beforeYouStartSettings = {
  pageTitle: 'Site details',
  heading: 'Site details'
}

/**
 * A GDS styled page controller for the before you start site details page.
 * @satisfies {Partial<ServerRoute>}
 */
export const beforeYouStartController = {
  handler(request, h) {
    const exemption = getExemptionCache(request)

    return h.view(BEFORE_YOU_START_SITE_DETAILS_VIEW_ROUTE, {
      ...beforeYouStartSettings,
      projectName: exemption.projectName
    })
  }
}
