import {
  getCoordinateSystem,
  getExemptionCache,
  resetExemptionSiteDetails
} from '~/src/server/common/helpers/session-cache/utils.js'
import { routes } from '~/src/server/common/constants/routes.js'
import {
  getCoordinateSystemText,
  getReviewSummaryText,
  getCoordinateDisplayText,
  getSiteDetailsBackLink,
  getFileUploadSummaryData,
  getFileUploadBackLink
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
    let siteDetails = exemption.siteDetails ?? {}

    // If we have an exemption ID but incomplete site details, load from MongoDB
    if (exemption.id && exemption.siteDetails === undefined) {
      try {
        const { payload } = await authenticatedGetRequest(
          request,
          `/exemption/${exemption.id}`
        )
        if (payload?.value?.siteDetails) {
          siteDetails = payload.value.siteDetails
          request.logger.info('Loaded site details from MongoDB for display', {
            exemptionId: exemption.id,
            coordinatesType: siteDetails.coordinatesType
          })
        }
      } catch (error) {
        request.logger.error('Failed to load exemption data from MongoDB', {
          error: error.message,
          exemptionId: exemption.id
        })
        // Continue with session data even if MongoDB load fails
      }
    }

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
    const { circleWidth } = siteDetails

    const summaryData = {
      method: getReviewSummaryText(siteDetails),
      coordinateSystem: getCoordinateSystemText(coordinateSystem),
      coordinates: getCoordinateDisplayText(siteDetails, coordinateSystem),
      width: circleWidth ? `${circleWidth} metres` : ''
    }

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
      let dataToSave

      if (siteDetails.coordinatesType === 'file') {
        const uploadedFile = siteDetails.uploadedFile
        const geoJSON = siteDetails.geoJSON
        const featureCount = siteDetails.featureCount || 0

        dataToSave = {
          coordinatesType: 'file',
          fileUploadType: siteDetails.fileUploadType,
          geoJSON,
          featureCount,
          uploadedFile: {
            filename: uploadedFile.filename // Save filename for display
          },
          s3Location: {
            s3Bucket: uploadedFile.s3Location.s3Bucket,
            s3Key: uploadedFile.s3Location.s3Key,
            checksumSha256: uploadedFile.s3Location.checksumSha256
          }
        }

        request.logger.info('Saving file upload site details', {
          fileType: siteDetails.fileUploadType,
          featureCount,
          filename: uploadedFile.filename
        })
      } else {
        // Manual coordinate entry flow - use existing data structure
        dataToSave = exemption.siteDetails

        request.logger.info('Saving manual coordinate site details', {
          coordinatesType: siteDetails.coordinatesType,
          coordinatesEntry: siteDetails.coordinatesEntry
        })
      }

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
