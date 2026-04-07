import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'
import {
  reviewSiteDetailsController,
  reviewSiteDetailsSubmitController
} from '#src/server/marine-licence/site-details/review-site-details/controller.js'

export const reviewSiteDetailsRoutes = [
  {
    method: 'GET',
    path: marineLicenceRoutes.MARINE_LICENCE_REVIEW_SITE_DETAILS,
    ...reviewSiteDetailsController
  },
  {
    method: 'POST',
    path: marineLicenceRoutes.MARINE_LICENCE_REVIEW_SITE_DETAILS,
    ...reviewSiteDetailsSubmitController
  }
]
