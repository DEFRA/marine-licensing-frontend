import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'
import { renderFileUploadReview } from './utils.js'
import { getSiteDetailsBySite } from '#src/server/common/helpers/exemptions/session-cache/site-details-utils.js'
import {
  clearSavedMarineLicenceSiteDetails,
  getMarineLicenceCache,
  setMarineLicenceCache
} from '#src/server/common/helpers/marine-licence/session-cache/utils.js'
import { getMarineLicenceService } from '#src/services/marine-licence-service/index.js'

export const FILE_UPLOAD_REVIEW_VIEW_ROUTE =
  'marine-licence/site-details/review-site-details/file-upload-review'

const reviewSiteDetailsPageData = {
  pageTitle: 'Review site details',
  heading: 'Review site details'
}
export const reviewSiteDetailsController = {
  async handler(request, h) {
    const previousPage = request.headers?.referer
    const marineLicence = getMarineLicenceCache(request)
    const fromCheckYourAnswers = request.query?.from === 'check-your-answers'

    await clearSavedMarineLicenceSiteDetails(request, h)

    if (!marineLicence.id) {
      return h.redirect(marineLicenceRoutes.MARINE_LICENCE_TASK_LIST)
    }

    const marineLicenceService = getMarineLicenceService(request)
    const completeMarineLicence =
      await marineLicenceService.getMarineLicenceById(marineLicence.id)

    const { projectName, siteDetails } = completeMarineLicence

    await setMarineLicenceCache(request, h, {
      id: marineLicence.id,
      projectName,
      siteDetails
    })

    const firstSite = getSiteDetailsBySite({
      ...completeMarineLicence,
      siteDetails
    })
    const { coordinatesType } = firstSite

    const returnToCheckYourAnswers = fromCheckYourAnswers
      ? marineLicenceRoutes.MARINE_LICENCE_CHECK_YOUR_ANSWERS
      : false

    if (coordinatesType !== 'file') {
      return h.redirect(marineLicenceRoutes.MARINE_LICENCE_TASK_LIST)
    }

    return renderFileUploadReview(h, {
      marineLicence: completeMarineLicence,
      siteDetails,
      previousPage,
      reviewSiteDetailsPageData,
      returnToCheckYourAnswers
    })
  }
}

export const reviewSiteDetailsSubmitController = {
  async handler(_request, h) {
    return h.redirect(marineLicenceRoutes.MARINE_LICENCE_TASK_LIST)
  }
}
