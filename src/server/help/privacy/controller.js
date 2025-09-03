/**
 * A GDS styled example about page controller.
 * Provided as an example, remove or modify as required.
 * @satisfies {Partial<ServerRoute>}
 */
export const privacyController = {
  handler(_request, h) {
    return h.view('help/privacy/index', {
      pageTitle: 'Privacy notice – Get permission for marine work',
      heading: 'Privacy notice – Get permission for marine work'
    })
  }
}

/**
 * @import { ServerRoute } from '@hapi/hapi'
 */
