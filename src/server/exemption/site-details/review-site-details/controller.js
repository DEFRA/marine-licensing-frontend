import {
  getExemptionCache,
  resetExemptionSiteDetails,
  setExemptionCache
} from '~/src/server/common/helpers/session-cache/utils.js'
import { routes } from '~/src/server/common/constants/routes.js'
import {
  getSiteDetails,
  prepareFileUploadDataForSave,
  prepareManualCoordinateDataForSave,
  renderFileUploadReview,
  renderManualCoordinateReview,
  handleSubmissionError
} from './utils.js'
import {
  authenticatedPatchRequest,
  authenticatedGetRequest
} from '~/src/server/common/helpers/authenticated-requests.js'
import { getSiteDetailsBySite } from '~/src/server/common/helpers/session-cache/site-details-utils.js'

export const REVIEW_SITE_DETAILS_VIEW_ROUTE =
  'exemption/site-details/review-site-details/index'

export const FILE_UPLOAD_REVIEW_VIEW_ROUTE =
  'exemption/site-details/review-site-details/file-upload-review'

const reviewSiteDetailsPageData = {
  pageTitle: 'Review site details',
  heading: 'Review site details'
}

/**
 * A GDS styled page controller for the review site details page.
 * @satisfies {Partial<ServerRoute>}
 */
export const reviewSiteDetailsController = {
  async handler(request, h) {
    const previousPage = request.headers?.referer
    const exemption = getExemptionCache(request)

    const siteDetails = await getSiteDetails(
      request,
      exemption,
      authenticatedGetRequest
    )

    const firstSite = getSiteDetailsBySite({ ...exemption, siteDetails })
    const { coordinatesType } = firstSite

    return coordinatesType === 'file'
      ? renderFileUploadReview(h, {
          exemption,
          siteDetails: firstSite,
          previousPage,
          reviewSiteDetailsPageData
        })
      : renderManualCoordinateReview(h, {
          exemption,
          siteDetails,
          previousPage,
          reviewSiteDetailsPageData
        })
  }
}

/**
 * A GDS styled page controller for the POST route in the review site details page.
 * @satisfies {Partial<ServerRoute>}
 */
export const reviewSiteDetailsSubmitController = {
  async handler(request, h) {
    const { payload } = request

    const exemption = getExemptionCache(request)
    const siteDetails = exemption.siteDetails
    const firstSite = siteDetails[0]
    try {
      const dataToSave =
        firstSite.coordinatesType === 'file'
          ? prepareFileUploadDataForSave(siteDetails, request)
          : prepareManualCoordinateDataForSave(exemption, request)

      await authenticatedPatchRequest(request, '/exemption/site-details', {
        multipleSiteDetails: exemption.multipleSiteDetails,
        siteDetails: dataToSave,
        id: exemption.id
      })

      if (payload?.add) {
        const updatedSiteDetails = [
          ...siteDetails,
          { coordinatesType: siteDetails[0].coordinatesType }
        ]
        setExemptionCache(request, {
          ...exemption,
          siteDetails: updatedSiteDetails
        })

        return h.redirect(
          `${routes.SITE_NAME}?site=${updatedSiteDetails.length}`
        )
      }

      resetExemptionSiteDetails(request)
      return h.redirect(routes.TASK_LIST)
    } catch (error) {
      throw handleSubmissionError(
        request,
        error,
        exemption.id,
        siteDetails.coordinatesType
      )
    }
  }
}
