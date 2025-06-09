import {
  reviewSiteDetailsController,
  reviewSiteDetailsSubmitController
} from '~/src/server/exemption/site-details/review-site-details/controller.js'
import { routes } from '~/src/server/common/constants/routes.js'

/**
 * Sets up the routes used in the review site details page.
 * These routes are registered in src/server/router.js.
 */

/**
 * @satisfies {ServerRegisterPluginObject<void>}
 */
export const reviewSiteDetailsRoutes = [
  {
    method: 'GET',
    path: routes.REVIEW_SITE_DETAILS,
    ...reviewSiteDetailsController
  },
  {
    method: 'POST',
    path: routes.REVIEW_SITE_DETAILS,
    ...reviewSiteDetailsSubmitController
  }
]
