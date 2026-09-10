import { vi } from 'vitest'
import { getMarineLicenceService } from '#src/services/marine-licence-service/index.js'
import { viewDetailsInternalUserController } from '#src/server/marine-licence/view-marine-licence-internal-user/controller.js'
import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'
import { saveRedactionController } from './redaction-controller.js'

vi.mock('#src/services/marine-licence-service/index.js')
vi.mock(
  '#src/server/marine-licence/view-marine-licence-internal-user/controller.js'
)

const VIEW_URL = `${marineLicenceRoutes.MARINE_LICENCE_VIEW_DETAILS_INTERNAL_USER}/test-id`

const createMockRequest = (overrides = {}) => ({
  params: { marineLicenceId: 'test-id' },
  payload: { fieldKey: 'preferredDates', text: 'Redacted text' },
  headers: { 'x-requested-with': 'XMLHttpRequest' },
  logger: { error: vi.fn() },
  ...overrides
})

const createMockH = () => {
  const response = { code: vi.fn().mockReturnThis() }
  return {
    response: vi.fn().mockReturnValue(response),
    redirect: vi.fn().mockReturnValue('redirected')
  }
}

describe('saveRedactionController', () => {
  let mockMarineLicenceService

  beforeEach(() => {
    mockMarineLicenceService = {
      saveRedaction: vi.fn().mockResolvedValue({
        fieldKey: 'preferredDates',
        text: 'Redacted text'
      })
    }

    vi.mocked(getMarineLicenceService).mockReturnValue(mockMarineLicenceService)
    vi.mocked(viewDetailsInternalUserController).handler = vi
      .fn()
      .mockResolvedValue('rendered page')
  })

  test('saves the redaction and re-renders the page for a fetch request', async () => {
    const mockRequest = createMockRequest()
    const mockH = createMockH()

    const result = await saveRedactionController.handler(mockRequest, mockH)

    expect(mockMarineLicenceService.saveRedaction).toHaveBeenCalledWith(
      'test-id',
      'preferredDates',
      'Redacted text'
    )
    expect(viewDetailsInternalUserController.handler).toHaveBeenCalledWith(
      mockRequest,
      mockH
    )
    expect(result).toBe('rendered page')
    expect(mockH.redirect).not.toHaveBeenCalled()
  })

  test('redirects back to the view page for a native form post', async () => {
    const mockRequest = createMockRequest({ headers: {} })
    const mockH = createMockH()

    await saveRedactionController.handler(mockRequest, mockH)

    expect(mockMarineLicenceService.saveRedaction).toHaveBeenCalled()
    expect(mockH.redirect).toHaveBeenCalledWith(VIEW_URL)
    expect(viewDetailsInternalUserController.handler).not.toHaveBeenCalled()
  })

  test('logs and throws 500 when the service fails', async () => {
    mockMarineLicenceService.saveRedaction.mockRejectedValue(
      new Error('Save failed')
    )

    const mockRequest = createMockRequest()
    const mockH = createMockH()

    await expect(
      saveRedactionController.handler(mockRequest, mockH)
    ).rejects.toMatchObject({ isBoom: true, output: { statusCode: 500 } })

    expect(mockRequest.logger.error).toHaveBeenCalledWith(
      expect.any(Error),
      'Error saving marine licence redaction'
    )
    expect(viewDetailsInternalUserController.handler).not.toHaveBeenCalled()
  })

  test('redirects instead of throwing when a native form post fails', async () => {
    mockMarineLicenceService.saveRedaction.mockRejectedValue(
      new Error('Save failed')
    )

    const mockRequest = createMockRequest({ headers: {} })
    const mockH = createMockH()

    await saveRedactionController.handler(mockRequest, mockH)

    expect(mockRequest.logger.error).toHaveBeenCalled()
    expect(mockH.redirect).toHaveBeenCalledWith(VIEW_URL)
  })

  describe('payload validation', () => {
    test('rejects an invalid payload with a 400 response', () => {
      const mockRequest = createMockRequest()
      const takeover = vi.fn()
      const mockH = {
        response: vi.fn().mockReturnValue({
          code: vi.fn().mockReturnValue({ takeover })
        })
      }

      saveRedactionController.options.validate.failAction(
        mockRequest,
        mockH,
        new Error('Invalid payload')
      )

      expect(mockRequest.logger.error).toHaveBeenCalledWith(
        { err: expect.any(Error) },
        'Invalid redaction payload'
      )
      expect(mockH.response).toHaveBeenCalled()
      expect(takeover).toHaveBeenCalled()
    })

    test.each([
      ['missing fieldKey', { text: 'Redacted text' }],
      ['missing text', { fieldKey: 'preferredDates' }]
    ])('schema rejects payload with %s', (_label, payload) => {
      const { error } =
        saveRedactionController.options.validate.payload.validate(payload)

      expect(error).toBeDefined()
    })

    test('schema allows empty text (clearing a redaction)', () => {
      const { error } =
        saveRedactionController.options.validate.payload.validate({
          fieldKey: 'preferredDates',
          text: ''
        })

      expect(error).toBeUndefined()
    })
  })
})
