import {
  getExemptionCache,
  resetExemptionSiteDetails,
  setExemptionCache
} from '#src/server/common/helpers/session-cache/utils.js'
import { routes } from '#src/server/common/constants/routes.js'
import {
  renderFileUploadReview,
  renderManualCoordinateReview
} from './utils.js'
import { getExemptionService } from '#src/services/exemption-service/index.js'
import { getSiteDetailsBySite } from '#src/server/common/helpers/session-cache/site-details-utils.js'

export const REVIEW_SITE_DETAILS_VIEW_ROUTE =
  'exemption/site-details/review-site-details/index'

export const FILE_UPLOAD_REVIEW_VIEW_ROUTE =
  'exemption/site-details/review-site-details/file-upload-review'

const reviewSiteDetailsPageData = {
  pageTitle: 'Review site details',
  heading: 'Review site details'
}
export const reviewSiteDetailsController = {
  async handler(request, h) {
    const previousPage = request.headers?.referer
    const exemption = getExemptionCache(request)

    if (!exemption.id) {
      return h.redirect(routes.TASK_LIST)
    }

    const exemptionService = getExemptionService(request)
    const completeExemption = await exemptionService.getExemptionById(
      exemption.id
    )

    const siteDetails = completeExemption.siteDetails
    const firstSite = getSiteDetailsBySite({
      ...completeExemption,
      siteDetails
    })
    const { coordinatesType } = firstSite

    return coordinatesType === 'file'
      ? renderFileUploadReview(h, {
          exemption: completeExemption,
          siteDetails,
          previousPage,
          reviewSiteDetailsPageData
        })
      : renderManualCoordinateReview(h, {
          exemption: completeExemption,
          siteDetails,
          previousPage,
          reviewSiteDetailsPageData
        })
  }
}
export const reviewSiteDetailsSubmitController = {
  async handler(request, h) {
    const { payload } = request
    const exemption = getExemptionCache(request)

    if (!exemption.id) {
      return h.redirect(routes.TASK_LIST)
    }

    const exemptionService = getExemptionService(request)
    const completeExemption = await exemptionService.getExemptionById(
      exemption.id
    )

    const siteDetails = completeExemption.siteDetails

    if (payload?.add) {
      const updatedSiteDetails = [
        ...siteDetails,
        { coordinatesType: siteDetails[0].coordinatesType }
      ]
      setExemptionCache(request, {
        ...completeExemption,
        siteDetails: updatedSiteDetails
      })

      return h.redirect(`${routes.SITE_NAME}?site=${updatedSiteDetails.length}`)
    }

    resetExemptionSiteDetails(request)
    return h.redirect(routes.TASK_LIST)
  }
}
