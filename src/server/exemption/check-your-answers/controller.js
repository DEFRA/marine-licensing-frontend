import Boom from '@hapi/boom'
import { getExemptionCache } from '~/src/server/common/helpers/session-cache/utils.js'
import {
  authenticatedGetRequest,
  authenticatedPostRequest
} from '~/src/server/common/helpers/authenticated-requests.js'
import {
  getCoordinateSystemText,
  getCoordinateDisplayText,
  getReviewSummaryText,
  getFileUploadSummaryData
} from '~/src/server/exemption/site-details/review-site-details/utils.js'

const checkYourAnswersViewContent = {
  title: 'Check your answers',
  description: 'Please review your answers before submitting your application.',
  backLink: '/exemption/task-list'
}

const CHECK_YOUR_ANSWERS_VIEW_ROUTE = 'exemption/check-your-answers/index'

export const checkYourAnswersController = {
  async handler(request, h) {
    const exemption = getExemptionCache(request)

    const { id } = exemption
    if (!id) {
      throw Boom.notFound(`Exemption not found`, { id })
    }

    const { payload } = await authenticatedGetRequest(
      request,
      `/exemption/${id}`
    )

    if (!payload?.value?.taskList) {
      throw Boom.notFound(`Exemption data not found for id: ${id}`, { id })
    }

    let siteDetails = null
    if (exemption.siteDetails) {
      const { coordinatesType } = exemption.siteDetails

      if (coordinatesType === 'file') {
        // Handle file upload site details
        try {
          const fileUploadData = getFileUploadSummaryData(exemption)
          siteDetails = {
            ...exemption.siteDetails,
            isFileUpload: true,
            method: fileUploadData.method,
            fileType: fileUploadData.fileType,
            filename: fileUploadData.filename
          }
        } catch (error) {
          request.logger.error('Error getting file upload summary data', {
            error: error.message
          })
          // Fallback to basic site details if file upload data unavailable
          siteDetails = {
            ...exemption.siteDetails,
            isFileUpload: true,
            method: 'Upload a file with the coordinates of the site',
            fileType:
              exemption.siteDetails.fileUploadType === 'kml'
                ? 'KML'
                : 'Shapefile',
            filename:
              exemption.siteDetails.uploadedFile?.filename || 'Unknown file'
          }
        }
      } else {
        // Handle manual coordinate site details (existing logic)
        siteDetails = {
          ...exemption.siteDetails,
          isFileUpload: false,
          coordinateSystemText: getCoordinateSystemText(
            exemption.siteDetails.coordinateSystem
          ),
          coordinateDisplayText: getCoordinateDisplayText(
            exemption.siteDetails,
            exemption.siteDetails.coordinateSystem
          ),
          reviewSummaryText: getReviewSummaryText(exemption.siteDetails)
        }
      }
    }

    return h.view(CHECK_YOUR_ANSWERS_VIEW_ROUTE, {
      ...checkYourAnswersViewContent,
      ...exemption,
      siteDetails
    })
  }
}

export const checkYourAnswersSubmitController = {
  async handler(request, h) {
    const exemption = getExemptionCache(request)

    const { id } = exemption
    if (!id) {
      throw Boom.notFound(`Exemption not found`, { id })
    }

    try {
      const { payload: response } = await authenticatedPostRequest(
        request,
        '/exemption/submit',
        { id }
      )

      if (response?.message === 'success' && response?.value) {
        const { applicationReference } = response.value
        return h.redirect(
          `/exemption/confirmation?applicationReference=${applicationReference}`
        )
      }

      throw new Error('Unexpected API response format')
    } catch (error) {
      throw Boom.badRequest('Error submitting exemption', error)
    }
  }
}
