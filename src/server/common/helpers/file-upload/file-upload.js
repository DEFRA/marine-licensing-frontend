import { UPLOAD_A_FILE } from '#src/server/common/helpers/file-upload/constants.js'
import {
  errorDescriptionByFieldName,
  mapErrorsForDisplay
} from '#src/server/common/helpers/errors.js'

import {
  GEO_PARSER_ERROR_MESSAGES,
  CDP_ERROR_MESSAGES,
  FILE_TYPE_ERROR_MESSAGES,
  FILE_SIZE_ERROR_MESSAGES,
  DEFAULT_ERROR_MESSAGE,
  DEFAULT_GEO_PARSER_ERROR_MESSAGE
} from '#src/server/common/helpers/file-upload/error-messages.js'

export const CONSTRUCTION_DRAWING_ACCEPT_ATTRIBUTE =
  '.pdf,.bmp,.gif,.jpg,.jpeg,.png,.tif'

export const KML_SITE_NAME_GUIDANCE = [
  "We'll use a site name for each area in your file if one is included.",
  'In a KML file, use the name of each place.'
]

export const SHAPEFILE_SITE_NAME_GUIDANCE = [
  "We'll use a site name for each area in your file if one is included.",
  'In a shapefile, put the name in a column such as Name or Site_name for each area.'
]

export const getFileTypeContent = (fileUploadType) => {
  if (fileUploadType === 'kml') {
    return {
      heading: 'Upload a KML file',
      acceptAttribute: '.kml',
      siteNameGuidance: KML_SITE_NAME_GUIDANCE
    }
  } else if (fileUploadType === 'shapefile') {
    return {
      heading: 'Upload a shapefile',
      acceptAttribute: '.zip',
      siteNameGuidance: SHAPEFILE_SITE_NAME_GUIDANCE
    }
  } else {
    return {
      heading: UPLOAD_A_FILE,
      acceptAttribute: ''
    }
  }
}

export const getAllowedExtensions = (fileType) => {
  switch (fileType) {
    case 'kml':
      return ['kml']
    case 'shapefile':
      return ['zip']
    case 'construction-drawing':
      return ['pdf', 'bmp', 'gif', 'jpg', 'jpeg', 'png', 'tif']
    default:
      return []
  }
}

export const createFileUploadErrorDisplay = (error, request) => {
  const { fieldName, message, fileType } = error

  const errorDetail = {
    path: [fieldName], // Must be array to match Joi validation format
    message,
    type: 'upload.error'
  }

  const errorSummary = mapErrorsForDisplay([errorDetail], {
    [message]: message
  })

  const errors = errorDescriptionByFieldName(errorSummary)

  request.logger.debug(
    {
      message,
      fieldName,
      fileType
    },
    'Displaying upload error from session'
  )

  return { errorSummary, errors }
}

export const isMultipleSitesFile = (coordinateData) =>
  coordinateData.featureCount > 1

export const getGeoParserErrorMessage = (errorCode) => {
  return (
    GEO_PARSER_ERROR_MESSAGES[errorCode] || DEFAULT_GEO_PARSER_ERROR_MESSAGE
  )
}

export const getCdpErrorMessageFromCode = (errorCode, fileType) => {
  if (errorCode === 'INVALID_FILE_TYPE') {
    return FILE_TYPE_ERROR_MESSAGES[fileType] || CDP_ERROR_MESSAGES[errorCode]
  }

  if (errorCode === 'FILE_TOO_LARGE') {
    return FILE_SIZE_ERROR_MESSAGES[fileType] || CDP_ERROR_MESSAGES[errorCode]
  }

  return CDP_ERROR_MESSAGES[errorCode] || DEFAULT_ERROR_MESSAGE
}
