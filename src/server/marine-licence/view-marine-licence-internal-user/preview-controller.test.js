import { vi } from 'vitest'
import { getMarineLicenceService } from '#src/services/marine-licence-service/index.js'
import {
  PREVIEW_VIEW_ROUTE,
  previewController
} from '#src/server/marine-licence/view-marine-licence-internal-user/preview-controller.js'
import Boom from '@hapi/boom'
import { errorMessages } from '#src/server/common/constants/error-messages.js'
import { mockRedactedMarineLicenceApplication } from '#src/server/test-helpers/mocks/marine-licence-mocks.js'
import { toApplicationReferenceUrlSegment } from '#src/server/common/helpers/marine-licence/application-reference-url-segment.js'
import { createMockRequest } from '#src/server/test-helpers/mocks/helpers.js'

vi.mock('#src/server/common/helpers/marine-licence/site-data.js', () => ({
  buildSiteData: vi
    .fn()
    .mockReturnValue({ coordinatesType: null, summaryData: [] })
}))

vi.mock('#src/services/marine-licence-service/index.js')

const createSubmittedMarineLicence = (overrides = {}) => ({
  ...mockRedactedMarineLicenceApplication,
  ...overrides
})

describe('marine-licence view details preview redaction controller', () => {
  let mockMarineLicenceService

  beforeEach(() => {
    mockMarineLicenceService = {
      getMarineLicenceByReference: vi
        .fn()
        .mockResolvedValue(mockRedactedMarineLicenceApplication)
    }

    vi.mocked(getMarineLicenceService).mockReturnValue(mockMarineLicenceService)
  })

  test('looks up marine licence by applicationReference', async () => {
    const mockServiceInstance = {
      getMarineLicenceByReference: vi
        .fn()
        .mockResolvedValue(mockRedactedMarineLicenceApplication)
    }
    vi.mocked(getMarineLicenceService).mockReturnValue(mockServiceInstance)

    const applicationReferenceUrlSegment = toApplicationReferenceUrlSegment(
      mockRedactedMarineLicenceApplication.applicationReference
    )

    const mockH = { view: vi.fn() }
    const mockRequest = createMockRequest({
      params: { applicationReference: applicationReferenceUrlSegment }
    })

    await previewController.handler(mockRequest, mockH)

    expect(
      mockServiceInstance.getMarineLicenceByReference
    ).toHaveBeenCalledWith(applicationReferenceUrlSegment)

    expect(mockH.view).toHaveBeenCalledWith(
      PREVIEW_VIEW_ROUTE,
      expect.objectContaining({
        pageCaption: mockRedactedMarineLicenceApplication.applicationReference
      })
    )
  })

  test('should log and throw 403 when marine licence is in Draft status', async () => {
    const draftMarineLicence = createSubmittedMarineLicence({
      status: 'Draft'
    })
    const mockServiceInstance = {
      getMarineLicenceByReference: vi.fn().mockResolvedValue(draftMarineLicence)
    }

    vi.mocked(getMarineLicenceService).mockReturnValue(mockServiceInstance)

    const mockH = { view: vi.fn() }
    const mockRequest = createMockRequest({
      params: { applicationReference: 'test-ref' }
    })

    await expect(
      previewController.handler(mockRequest, mockH)
    ).rejects.toMatchObject({ isBoom: true, output: { statusCode: 403 } })

    expect(mockRequest.logger.error).toHaveBeenCalledWith(
      {
        event: {
          action: 'view-details-internal-user-preview',
          outcome: 'failure',
          reference: 'test-ref',
          reason: errorMessages.MARINE_LICENCE_NOT_SUBMITTED
        }
      },
      `${errorMessages.MARINE_LICENCE_NOT_SUBMITTED} for test-ref`
    )
  })

  test('should log and throw 500 for unexpected errors', async () => {
    const mockServiceInstance = {
      getMarineLicenceByReference: vi
        .fn()
        .mockRejectedValue(new Error('Unexpected'))
    }

    vi.mocked(getMarineLicenceService).mockReturnValue(mockServiceInstance)

    const mockH = { view: vi.fn() }
    const mockRequest = createMockRequest()

    await expect(
      previewController.handler(mockRequest, mockH)
    ).rejects.toMatchObject({ isBoom: true, output: { statusCode: 500 } })

    expect(mockRequest.logger.error).toHaveBeenCalledWith(
      expect.any(Error),
      'Error displaying marine licence preview'
    )
  })

  test('propagates Boom errors from the service unchanged', async () => {
    const mockServiceInstance = {
      getMarineLicenceByReference: vi
        .fn()
        .mockRejectedValue(Boom.notFound('Not found'))
    }

    vi.mocked(getMarineLicenceService).mockReturnValue(mockServiceInstance)

    const mockH = { view: vi.fn() }
    const mockRequest = createMockRequest()

    await expect(
      previewController.handler(mockRequest, mockH)
    ).rejects.toMatchObject({ isBoom: true, output: { statusCode: 404 } })
  })
})
