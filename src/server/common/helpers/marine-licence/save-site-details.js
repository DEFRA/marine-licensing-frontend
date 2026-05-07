import { authenticatedPatchRequest } from '#src/server/common/helpers/authenticated-requests.js'
import {
  getMarineLicenceCache,
  setMarineLicenceCache
} from '#src/server/common/helpers/marine-licence/session-cache/utils.js'
import { routes, apiRoutes } from '#src/server/common/constants/routes.js'
import Boom from '@hapi/boom'

export const prepareFileUploadDataForSave = (siteDetails, request) => {
  const dataToSave = []

  for (const site of siteDetails) {
    const uploadedFile = site.uploadedFile
    const geoJSON = site.geoJSON
    const featureCount = site.featureCount || 0

    const siteToSave = {
      coordinatesType: 'file',
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
      },
      siteName: site.siteName,
      activityDetails: site.activityDetails
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

export const prepareManualCoordinateDataForSave = (siteDetails) => {
  const dataToSave = []

  for (const site of siteDetails) {
    const siteToSave = {
      coordinatesType: site.coordinatesType,
      coordinatesEntry: site.coordinatesEntry,
      coordinateSystem: site.coordinateSystem,
      coordinates: site.coordinates,
      siteName: site.siteName,
      activityDetails: site.activityDetails
    }

    if (site.coordinatesEntry === 'single') {
      siteToSave.circleWidth = site.circleWidth
    }

    dataToSave.push(siteToSave)
  }

  return dataToSave
}

export const saveSiteDetailsToBackend = async (
  request,
  h,
  { siteIndex } = {}
) => {
  const marineLicence = getMarineLicenceCache(request)
  const { siteDetails } = marineLicence
  const coordinatesType = siteDetails[0]?.coordinatesType

  if (!marineLicence.id) {
    request.logger.error('Marine Licence ID is required to save site details')
    const error = Boom.unauthorized(
      'Marine Licence ID is required to save site details'
    )
    error.redirectPath = routes.DASHBOARD
    throw error
  }

  if (!siteDetails || siteDetails.length === 0) {
    throw new Error('Site details are required to save')
  }

  const isSingleSite = siteIndex !== undefined

  const siteDetailsToUpdate = isSingleSite
    ? siteDetails.filter((_, index) => index === siteIndex)
    : siteDetails

  const dataToSave =
    coordinatesType === 'file'
      ? prepareFileUploadDataForSave(siteDetailsToUpdate, request)
      : prepareManualCoordinateDataForSave(siteDetailsToUpdate)

  try {
    if (isSingleSite) {
      await authenticatedPatchRequest(
        request,
        apiRoutes.UPDATE_MARINE_LICENCE_SITE,
        {
          siteDetails: dataToSave[0],
          siteIndex,
          id: marineLicence.id
        }
      )
    } else {
      await authenticatedPatchRequest(
        request,
        apiRoutes.UPDATE_MARINE_LICENCE_SITE_DETAILS,
        {
          siteDetails: dataToSave,
          id: marineLicence.id
        }
      )
    }

    await setMarineLicenceCache(request, h, {
      ...marineLicence,
      siteDetails: isSingleSite
        ? siteDetails.with(siteIndex, dataToSave)
        : dataToSave
    })

    request.logger.info(
      {
        marineLicenceId: marineLicence.id,
        siteCount: dataToSave.length,
        coordinatesType,
        isSingleSite
      },
      'Successfully saved site details to backend'
    )
  } catch (error) {
    request.logger.error(
      {
        err: error,
        marineLicenceId: marineLicence.id,
        coordinatesType
      },
      'Failed to save site details to backend'
    )
    throw error
  }
}
