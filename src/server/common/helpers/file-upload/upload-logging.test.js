import { vi } from 'vitest'
import {
  logExtractionSuccess,
  logExtractionError,
  logSuccessfulProcessing
} from '#src/server/common/helpers/file-upload/upload-logging.js'

const createMockRequest = () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn()
  }
})

describe('#logExtractionSuccess', () => {
  test('should log feature count and coordinate count', () => {
    const request = createMockRequest()
    const geoJSON = { features: [{}, {}] }
    const extractedCoordinates = [
      [1, 2],
      [3, 4],
      [5, 6]
    ]

    logExtractionSuccess(request, geoJSON, extractedCoordinates)

    expect(request.logger.info).toHaveBeenCalledWith(
      { featureCount: 2, coordinateCount: 3 },
      'FileUpload: Successfully extracted coordinates'
    )
  })
})

describe('#logExtractionError', () => {
  test('should log error with full file context', () => {
    const request = createMockRequest()
    const error = new Error('Test error')
    const fileContext = {
      s3Bucket: 'test-bucket',
      s3Key: 'test-key',
      fileType: 'kml'
    }

    logExtractionError(request, error, fileContext)

    expect(request.logger.error).toHaveBeenCalledWith(
      { err: error, ...fileContext },
      'FileUpload: ERROR: Failed to extract coordinates from file'
    )
  })
})

describe('#logSuccessfulProcessing', () => {
  test('should log filename, file type and feature count on completion', () => {
    const request = createMockRequest()
    const status = { filename: 'test.kml' }
    const uploadConfig = { fileType: 'kml' }
    const coordinateData = { featureCount: 2 }

    logSuccessfulProcessing(request, status, uploadConfig, coordinateData)

    expect(request.logger.info).toHaveBeenCalledWith(
      { filename: 'test.kml', fileType: 'kml', featureCount: 2 },
      'FileUpload: File upload and coordinate extraction completed successfully'
    )
  })
})
