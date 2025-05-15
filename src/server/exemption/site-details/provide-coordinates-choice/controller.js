export const PROVIDE_COORDINATES_CHOICE_ROUTE =
  '/exemption/how-do-you-want-to-provide-the-coordinates'
export const PROVIDE_COORDINATES_CHOICE_VIEW_ROUTE =
  'exemption/site-details/provide-coordinates-choice/index'

const provideCoordinatesSettings = {
  pageTitle: 'How do you want to provide the site location?',
  heading: 'How do you want to provide the site location?'
}

/**
 * A GDS styled page controller for the provide the coordinates choice page.
 * @satisfies {Partial<ServerRoute>}
 */
export const provideCoordinatesChoiceController = {
  handler(request, h) {
    return h.view(PROVIDE_COORDINATES_CHOICE_VIEW_ROUTE, {
      ...provideCoordinatesSettings
    })
  }
}
