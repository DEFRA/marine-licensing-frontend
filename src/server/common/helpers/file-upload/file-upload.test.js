import {
  getAllowedExtensions,
  getCdpErrorMessageFromCode,
  getGeoParserErrorMessage
} from '#src/server/common/helpers/file-upload/file-upload.js'
import {
  CDP_ERROR_MESSAGES,
  FILE_TYPE_ERROR_MESSAGES,
  DEFAULT_ERROR_MESSAGE,
  DEFAULT_GEO_PARSER_ERROR_MESSAGE,
  GEO_PARSER_ERROR_MESSAGES
} from '#src/server/common/helpers/file-upload/error-messages.js'

describe('#getAllowedExtensions', () => {
  test.each([
    ['kml', ['kml']],
    ['shapefile', ['zip']],
    ['unknown', []],
    [undefined, []]
  ])(
    'should return correct extensions for file type %s',
    (fileType, expected) => {
      expect(getAllowedExtensions(fileType)).toEqual(expected)
    }
  )
})

describe('#getCdpErrorMessageFromCode', () => {
  test.each([
    ['VIRUS_DETECTED', 'kml', CDP_ERROR_MESSAGES.VIRUS_DETECTED],
    ['FILE_EMPTY', 'kml', CDP_ERROR_MESSAGES.FILE_EMPTY],
    ['FILE_TOO_LARGE', 'kml', CDP_ERROR_MESSAGES.FILE_TOO_LARGE],
    ['NO_FILE_SELECTED', 'kml', CDP_ERROR_MESSAGES.NO_FILE_SELECTED],
    ['UPLOAD_ERROR', 'kml', CDP_ERROR_MESSAGES.UPLOAD_ERROR],
    ['INVALID_FILE_TYPE', 'kml', FILE_TYPE_ERROR_MESSAGES.kml],
    ['INVALID_FILE_TYPE', 'shapefile', FILE_TYPE_ERROR_MESSAGES.shapefile],
    ['INVALID_FILE_TYPE', 'foo', CDP_ERROR_MESSAGES.INVALID_FILE_TYPE],
    [null, 'kml', DEFAULT_ERROR_MESSAGE],
    ['UNKNOWN_CODE', 'kml', DEFAULT_ERROR_MESSAGE]
  ])(
    'should return correct message for error code %s and file type %s',
    (errorCode, fileType, expected) => {
      expect(getCdpErrorMessageFromCode(errorCode, fileType)).toBe(expected)
    }
  )
})

describe('#getGeoParserErrorMessage', () => {
  test.each([
    [
      'SHAPEFILE_MISSING_CORE_FILES',
      GEO_PARSER_ERROR_MESSAGES.SHAPEFILE_MISSING_CORE_FILES
    ],
    [
      'SHAPEFILE_MISSING_PRJ_FILE',
      GEO_PARSER_ERROR_MESSAGES.SHAPEFILE_MISSING_PRJ_FILE
    ],
    [
      'SHAPEFILE_PRJ_FILE_TOO_LARGE',
      GEO_PARSER_ERROR_MESSAGES.SHAPEFILE_PRJ_FILE_TOO_LARGE
    ],
    ['SHAPEFILE_NOT_FOUND', GEO_PARSER_ERROR_MESSAGES.SHAPEFILE_NOT_FOUND],
    ['ZIP_TOO_MANY_FILES', GEO_PARSER_ERROR_MESSAGES.ZIP_TOO_MANY_FILES],
    ['ZIP_TOO_LARGE', GEO_PARSER_ERROR_MESSAGES.ZIP_TOO_LARGE],
    [
      'ZIP_COMPRESSION_SUSPICIOUS',
      GEO_PARSER_ERROR_MESSAGES.ZIP_COMPRESSION_SUSPICIOUS
    ],
    [
      'COORDINATES_INVALID_LONGITUDE',
      GEO_PARSER_ERROR_MESSAGES.COORDINATES_INVALID_LONGITUDE
    ],
    [
      'COORDINATES_INVALID_LATITUDE',
      GEO_PARSER_ERROR_MESSAGES.COORDINATES_INVALID_LATITUDE
    ],
    [
      'FEATURES_CONTAIN_POINT_OR_LINE',
      GEO_PARSER_ERROR_MESSAGES.FEATURES_CONTAIN_POINT_OR_LINE
    ],
    [null, DEFAULT_GEO_PARSER_ERROR_MESSAGE],
    ['UNKNOWN_CODE', DEFAULT_GEO_PARSER_ERROR_MESSAGE]
  ])(
    'should return correct message for error code %s',
    (errorCode, expected) => {
      expect(getGeoParserErrorMessage(errorCode)).toBe(expected)
    }
  )
})
