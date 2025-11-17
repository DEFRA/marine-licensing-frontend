import { authenticatedPatchRequest } from '#src/server/common/helpers/authenticated-requests.js'
import {
  getExemptionCache,
  setExemptionCache
} from '#src/server/common/helpers/session-cache/utils.js'

export const prepareFileUploadDataForSave = (siteDetails, request) => {
  const dataToSave = []

  const exemption = getExemptionCache(request)
  if (exemption.multipleSiteDetails?.sameActivityDescription === 'yes') {
    const firstSiteDescription = siteDetails[0]?.activityDescription
    if (firstSiteDescription) {
      for (const site of siteDetails.slice(1)) {
        site.activityDescription = firstSiteDescription
      }
    }
  }

  if (exemption.multipleSiteDetails?.sameActivityDates === 'yes') {
    const firstSiteDates = siteDetails[0]?.activityDates
    if (firstSiteDates) {
      for (const site of siteDetails.slice(1)) {
        site.activityDates = firstSiteDates
      }
    }
  }

  for (const site of siteDetails) {
    const uploadedFile = site.uploadedFile
    const geoJSON = site.geoJSON
    const featureCount = site.featureCount || 0

    const siteToSave = {
      coordinatesType: 'file',
      activityDates: site.activityDates,
      activityDescription: site.activityDescription,
      siteName: site.siteName,
      fileUploadType: site.fileUploadType,
      geoJSON,
      featureCount,
      uploadedFile: {
        filename: uploadedFile.filename
      },
      s3Location: {
        s3Bucket: site.s3Location.s3Bucket,
        s3Key: site.s3Location.s3Key,
        checksumSha256: site.s3Location.checksumSha256
      }
    }

    request.logger.info(
      {
        fileType: site.fileUploadType,
        featureCount,
        filename: uploadedFile.filename
      },
      'Saving file upload site details'
    )

    dataToSave.push(siteToSave)
  }

  return dataToSave
}

export const prepareManualCoordinateDataForSave = (exemption, request) => {
  for (const site of exemption.siteDetails) {
    request.logger.info(
      {
        coordinatesType: site.coordinatesType,
        coordinatesEntry: site.coordinatesEntry
      },
      'Saving manual coordinate site details'
    )
  }

  return exemption.siteDetails
}

export const saveSiteDetailsToBackend = async (request, h) => {
  const exemption = getExemptionCache(request)
  const { siteDetails } = exemption
  const coordinatesType = siteDetails[0]?.coordinatesType

  if (!exemption.id) {
    throw new Error('Exemption ID is required to save site details')
  }

  if (!siteDetails || siteDetails.length === 0) {
    throw new Error('Site details are required to save')
  }

  const dataToSave =
    coordinatesType === 'file'
      ? prepareFileUploadDataForSave(siteDetails, request)
      : prepareManualCoordinateDataForSave(exemption, request)

  try {
    await authenticatedPatchRequest(request, '/exemption/site-details', {
      multipleSiteDetails: exemption.multipleSiteDetails,
      siteDetails: dataToSave,
      id: exemption.id
    })

    await setExemptionCache(request, h, {
      ...exemption,
      siteDetails: dataToSave
    })

    request.logger.info(
      {
        exemptionId: exemption.id,
        siteCount: dataToSave.length,
        coordinatesType
      },
      'Successfully saved site details to backend'
    )
  } catch (error) {
    request.logger.error(
      {
        err: error,
        exemptionId: exemption.id,
        coordinatesType
      },
      'Failed to save site details to backend'
    )
    throw error
  }
}
