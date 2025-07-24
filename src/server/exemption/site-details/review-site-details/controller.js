import {
  getCoordinateSystem,
  getExemptionCache,
  resetExemptionSiteDetails
} from '~/src/server/common/helpers/session-cache/utils.js'
import { routes } from '~/src/server/common/constants/routes.js'
import {
  getSiteDetailsBackLink,
  getFileUploadSummaryData,
  getFileUploadBackLink,
  buildManualCoordinateSummaryData,
  loadSiteDetailsFromMongoDB,
  prepareFileUploadDataForSave,
  prepareManualCoordinateDataForSave
} from './utils.js'
import {
  authenticatedPatchRequest,
  authenticatedGetRequest
} from '~/src/server/common/helpers/authenticated-requests.js'
import Boom from '@hapi/boom'

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
    const siteDetails = await loadSiteDetailsFromMongoDB(
      request,
      exemption,
      authenticatedGetRequest
    )

    if (siteDetails.coordinatesType === 'file') {
      const fileUploadSummaryData = getFileUploadSummaryData({
        ...exemption,
        siteDetails
      })

      return h.view(FILE_UPLOAD_REVIEW_VIEW_ROUTE, {
        ...reviewSiteDetailsPageData,
        backLink: getFileUploadBackLink(previousPage),
        projectName: exemption.projectName,
        fileUploadSummaryData
      })
    }

    // Manual coordinate entry flow
    const { coordinateSystem } = getCoordinateSystem(request)
    const summaryData = buildManualCoordinateSummaryData(
      siteDetails,
      coordinateSystem
    )

    return h.view(REVIEW_SITE_DETAILS_VIEW_ROUTE, {
      ...reviewSiteDetailsPageData,
      backLink: getSiteDetailsBackLink(previousPage),
      projectName: exemption.projectName,
      summaryData
    })
  }
}

/**
 * A GDS styled page controller for the POST route in the review site details page.
 * @satisfies {Partial<ServerRoute>}
 */
export const reviewSiteDetailsSubmitController = {
  async handler(request, h) {
    const exemption = getExemptionCache(request)
    const siteDetails = exemption.siteDetails ?? {}

    try {
      const dataToSave =
        siteDetails.coordinatesType === 'file'
          ? prepareFileUploadDataForSave(siteDetails, request)
          : prepareManualCoordinateDataForSave(exemption, request)

      await authenticatedPatchRequest(request, '/exemption/site-details', {
        siteDetails: dataToSave,
        id: exemption.id
      })

      resetExemptionSiteDetails(request)
      return h.redirect(routes.TASK_LIST)
    } catch (e) {
      request.logger.error('Error submitting site review', {
        error: e.message,
        exemptionId: exemption.id,
        coordinatesType: siteDetails.coordinatesType
      })
      throw Boom.badRequest(`Error submitting site review`, e)
    }
  }
}
