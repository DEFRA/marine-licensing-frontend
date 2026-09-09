import { vi } from 'vitest'
import { getMarineLicenceService } from '#src/services/marine-licence-service/index.js'
import { saveRedactionController } from './redaction-controller.js'
import { statusCodes } from '#src/server/common/constants/status-codes.js'

vi.mock('#src/services/marine-licence-service/index.js')

const createMockRequest = (overrides = {}) => ({
  params: { marineLicenceId: 'test-id' },
  payload: { fieldKey: 'preferredDates', text: 'Redacted text' },
  headers: { 'x-requested-with': 'XMLHttpRequest' },
  logger: { error: vi.fn() },
  ...overrides
})

const createMockH = () => {
  const response = { code: vi.fn().mockReturnThis() }
  return { response: vi.fn().mockReturnValue(response) }
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
  })

  test('saves the redaction and returns 200 with the saved value', async () => {
    const mockRequest = createMockRequest()
    const mockH = createMockH()

    await saveRedactionController.handler(mockRequest, mockH)

    expect(mockMarineLicenceService.saveRedaction).toHaveBeenCalledWith(
      'test-id',
      'preferredDates',
      'Redacted text'
    )
    expect(mockH.response).toHaveBeenCalledWith({
      fieldKey: 'preferredDates',
      text: 'Redacted text'
    })
    expect(mockH.response.mock.results[0].value.code).toHaveBeenCalledWith(
      statusCodes.ok
    )
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
