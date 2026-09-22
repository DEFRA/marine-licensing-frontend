import { REDACTION_UPLOAD_KEY } from '#src/server/common/constants/cache.js'
import {
  clearRedactionUpload,
  getRedactionUpload,
  setRedactionUpload
} from '#src/server/common/helpers/marine-licence/session-cache/redaction-upload.js'
import {
  createMockRequest,
  createMockH
} from '#src/server/test-helpers/mocks/helpers.js'

describe('redaction-upload', () => {
  let mockRequest
  let mockH

  beforeEach(() => {
    mockH = createMockH()
    mockRequest = createMockRequest()
  })

  describe('setRedactionUpload', () => {
    test('sets the upload handoff then commits', async () => {
      const upload = {
        uploadId: 'test-upload-id',
        statusUrl: 'test-status-url'
      }

      await setRedactionUpload(mockRequest, mockH, upload)

      expect(mockRequest.yar.set).toHaveBeenCalledWith(
        REDACTION_UPLOAD_KEY,
        upload
      )
      expect(mockRequest.yar.commit).toHaveBeenCalledWith(mockH)
    })
  })

  describe('getRedactionUpload', () => {
    test('returns the stored upload', () => {
      const upload = {
        uploadId: 'test-upload-id',
        statusUrl: 'test-status-url'
      }
      mockRequest.yar.get.mockReturnValue(upload)

      expect(getRedactionUpload(mockRequest)).toEqual(upload)
      expect(mockRequest.yar.get).toHaveBeenCalledWith(REDACTION_UPLOAD_KEY)
    })

    test('returns an empty object when nothing is stored', () => {
      mockRequest.yar.get.mockReturnValue(undefined)

      expect(getRedactionUpload(mockRequest)).toEqual({})
    })
  })

  describe('clearRedactionUpload', () => {
    test('clears the upload handoff then commits', async () => {
      await clearRedactionUpload(mockRequest, mockH)

      expect(mockRequest.yar.clear).toHaveBeenCalledWith(REDACTION_UPLOAD_KEY)
      expect(mockRequest.yar.commit).toHaveBeenCalledWith(mockH)
    })
  })
})
