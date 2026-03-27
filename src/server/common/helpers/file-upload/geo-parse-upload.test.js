import { vi } from 'vitest'
import {
  validateAndExtractGeoJSON,
  validateUploadedFile,
  extractGeoParserErrorCode
} from '#src/server/common/helpers/file-upload/geo-parse-upload.js'
import * as fileValidationModule from '#src/services/file-validation/index.js'
import * as fileUploadModule from '#src/server/common/helpers/file-upload/file-upload.js'

vi.mock('~/src/services/file-validation/index.js')
vi.mock('~/src/server/common/helpers/file-upload/file-upload.js')

describe('#validateAndExtractGeoJSON', () => {
  const buildGeoJSON = (featureCount = 1) => ({
    type: 'FeatureCollection',
    features: Array.from({ length: featureCount }, (_, i) => ({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [i + 1, i + 2] }
    }))
  })

  test('should return GeoJSON from a valid success response', () => {
    const geoJSON = buildGeoJSON(1)
    const response = { payload: { message: 'success', value: geoJSON } }

    expect(validateAndExtractGeoJSON(response)).toBe(geoJSON)
  })

  test('should return GeoJSON with multiple features from a valid success response', () => {
    const geoJSON = buildGeoJSON(3)
    const response = { payload: { message: 'success', value: geoJSON } }

    const result = validateAndExtractGeoJSON(response)
    expect(result.features).toHaveLength(3)
  })

  test('should throw when payload message is not success', () => {
    const response = {
      payload: { message: 'error', error: 'Could not parse file' }
    }

    expect(() => validateAndExtractGeoJSON(response)).toThrow(
      'Invalid geo-parser response'
    )
  })

  test('should throw when payload message is absent', () => {
    const response = {
      statusCode: 400,
      payload: { error: 'Invalid file format' }
    }

    expect(() => validateAndExtractGeoJSON(response)).toThrow(
      'Invalid geo-parser response'
    )
  })

  test('should throw when GeoJSON is missing features array', () => {
    const response = {
      payload: {
        message: 'success',
        value: { type: 'FeatureCollection' }
      }
    }

    expect(() => validateAndExtractGeoJSON(response)).toThrow(
      'Invalid GeoJSON structure'
    )
  })

  test('should throw when GeoJSON value is null', () => {
    const response = { payload: { message: 'success', value: null } }

    expect(() => validateAndExtractGeoJSON(response)).toThrow(
      'Invalid GeoJSON structure'
    )
  })
})

describe('#extractGeoParserErrorCode', () => {
  test.each([
    {
      description: 'error with data.payload.message',
      error: { data: { payload: { message: 'SHAPEFILE_MISSING_CORE_FILES' } } },
      expected: 'SHAPEFILE_MISSING_CORE_FILES'
    },
    {
      description: 'generic error with no data property',
      error: new Error('generic error'),
      expected: null
    },
    {
      description: 'error with null data',
      error: { data: null },
      expected: null
    }
  ])('should return $expected for $description', ({ error, expected }) => {
    expect(extractGeoParserErrorCode(error)).toBe(expected)
  })
})

describe('#validateUploadedFile', () => {
  const mockLogger = { info: vi.fn(), error: vi.fn(), warn: vi.fn() }
  const mockRequest = { logger: mockLogger }
  let mockValidateFileExtension

  beforeEach(() => {
    mockValidateFileExtension = vi.fn()
    vi.mocked(fileValidationModule.getFileValidationService).mockReturnValue({
      validateFileExtension: mockValidateFileExtension
    })
    vi.mocked(fileUploadModule.getAllowedExtensions).mockReturnValue(['kml'])
  })

  test('should call getFileValidationService with the request logger', async () => {
    mockValidateFileExtension.mockReturnValue({
      isValid: true,
      extension: 'kml',
      errorMessage: null
    })

    const validResult = { isValid: true, extension: 'kml', errorMessage: null }

    const result = await validateUploadedFile(
      { filename: 'test.kml' },
      { fileType: 'kml' },
      mockRequest
    )
    expect(mockValidateFileExtension).toHaveBeenCalledWith('test.kml', ['kml'])

    expect(fileValidationModule.getFileValidationService).toHaveBeenCalledWith(
      mockLogger
    )
    expect(result).toEqual(validResult)
  })

  test('should call getAllowedExtensions with the fileType', async () => {
    mockValidateFileExtension.mockReturnValue({
      isValid: true,
      extension: 'kml',
      errorMessage: null
    })

    await validateUploadedFile(
      { filename: 'test.kml' },
      { fileType: 'kml' },
      mockRequest
    )

    expect(fileUploadModule.getAllowedExtensions).toHaveBeenCalledWith('kml')
  })

  test('should return invalid result when file extension is not allowed', async () => {
    vi.mocked(fileUploadModule.getAllowedExtensions).mockReturnValue(['kml'])
    const invalidResult = {
      isValid: false,
      extension: 'pdf',
      errorMessage: 'The selected file must be a KML file'
    }
    mockValidateFileExtension.mockReturnValue(invalidResult)

    const result = await validateUploadedFile(
      { filename: 'document.pdf' },
      { fileType: 'kml' },
      mockRequest
    )

    expect(result).toEqual(invalidResult)
  })
})
