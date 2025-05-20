import { getExemptionCache } from '~/src/server/common/helpers/session-cache/utils.js'

export const PROVIDE_COORDINATES_CHOICE_ROUTE =
  '/exemption/how-do-you-want-to-provide-the-coordinates'
export const PROVIDE_COORDINATES_CHOICE_VIEW_ROUTE =
  'exemption/site-details/coordinates-type/index'

const provideCoordinatesSettings = {
  pageTitle: 'How do you want to provide the site location?',
  heading: 'How do you want to provide the site location?'
}

/**
 * A GDS styled page controller for the coordinates type page.
 * @satisfies {Partial<ServerRoute>}
 */
export const coordinatesTypeController = {
  handler(request, h) {
    const exemption = getExemptionCache(request)

    return h.view(PROVIDE_COORDINATES_CHOICE_VIEW_ROUTE, {
      ...provideCoordinatesSettings,
      projectName: exemption.projectName
    })
  }
}

/**
 * A GDS styled page controller for the POST route in the coordinates type page.
 * @satisfies {Partial<ServerRoute>}
 */
export const coordinatesTypeSubmitController = {
  handler(request, h) {
    const exemption = getExemptionCache(request)

    return h.view(PROVIDE_COORDINATES_CHOICE_VIEW_ROUTE, {
      ...provideCoordinatesSettings,
      projectName: exemption.projectName
    })
  }
}
