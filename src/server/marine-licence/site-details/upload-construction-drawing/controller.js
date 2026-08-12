import { getCdpUploadService } from '#src/services/cdp-upload-service/index.js'
import { config } from '#src/config/config.js'
import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'
import {
  getMarineLicenceCache,
  updateMarineLicenceSiteDetails
} from '#src/server/common/helpers/marine-licence/session-cache/utils.js'
import { getSiteDataFromParam } from '#src/server/common/helpers/site-details/site-name.js'
import { validateSiteAndDrawingParams } from '#src/server/common/helpers/marine-licence/session-cache/site-utils.js'
import { getConstructionDrawingBackLink } from '#src/server/marine-licence/site-details/utils/back-link.js'
import {
  CONSTRUCTION_DRAWING_ACCEPT_ATTRIBUTE,
  createFileUploadErrorDisplay
} from '#src/server/common/helpers/file-upload/file-upload.js'

export const UPLOAD_CONSTRUCTION_DRAWING_VIEW_ROUTE =
  'marine-licence/site-details/upload-construction-drawing/index'

const CONSTRUCTION_DRAWING_S3_PATH = 'marine-licence/construction-drawings'
const TEN_MB = 10 * 1024 * 1024

export const uploadConstructionDrawingController = {
  options: {
    pre: [validateSiteAndDrawingParams]
  },
  async handler(request, h) {
    const marineLicence = getMarineLicenceCache(request)
    const { siteIndex, siteNumber, drawingIndex, drawingNumber } =
      getSiteDataFromParam(request.query)

    const site = marineLicence.siteDetails?.[siteIndex] ?? {}
    const { uploadError } = site

    let errorSummary, errors
    if (uploadError) {
      const errorDisplay = createFileUploadErrorDisplay(uploadError, request)
      errorSummary = errorDisplay.errorSummary
      errors = errorDisplay.errors

      await updateMarineLicenceSiteDetails(
        request,
        h,
        siteIndex,
        'uploadError',
        null
      )
    }

    const cdpService = getCdpUploadService()
    const s3Bucket = config.get('cdpUploader').s3Bucket
    const uploadConfig = await cdpService.initiate({
      redirectUrl: `${marineLicenceRoutes.MARINE_LICENCE_UPLOAD_CONSTRUCTION_DRAWING_WAIT}?site=${siteNumber}`,
      s3Path: CONSTRUCTION_DRAWING_S3_PATH,
      s3Bucket,
      maxFileSize: TEN_MB
    })

    await updateMarineLicenceSiteDetails(
      request,
      h,
      siteIndex,
      'uploadConfig',
      {
        uploadId: uploadConfig.uploadId,
        statusUrl: uploadConfig.statusUrl,
        fileType: 'construction-drawing',
        siteIndex,
        drawingIndex
      }
    )

    return h.view(UPLOAD_CONSTRUCTION_DRAWING_VIEW_ROUTE, {
      pageTitle: `Site ${siteNumber}: Upload construction drawing ${drawingNumber}`,
      heading: `Site ${siteNumber}: Upload construction drawing ${drawingNumber}`,
      projectName: marineLicence.projectName,
      siteNumber,
      drawingNumber,
      uploadUrl: uploadConfig.uploadUrl,
      acceptAttribute: CONSTRUCTION_DRAWING_ACCEPT_ATTRIBUTE,
      backLink: getConstructionDrawingBackLink(siteNumber, drawingNumber),
      cancelLink: getConstructionDrawingBackLink(siteNumber, drawingNumber),
      errorSummary,
      errors
    })
  }
}
