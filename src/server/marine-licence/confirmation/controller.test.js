import { vi } from 'vitest'
import { confirmationController } from './controller.js'
import { getMarineLicenceCache } from '#src/server/common/helpers/marine-licence/session-cache/utils.js'

vi.mock(
  '~/src/server/common/helpers/marine-licence/session-cache/utils.js'
)

describe('confirmationController', () => {
  const mockH = { view: vi.fn() }

  beforeEach(() => {
    vi.mocked(getMarineLicenceCache).mockReturnValue({
      id: 'test-id',
      projectName: 'Test Project'
    })
  })

  describe('handler', () => {
    test('renders confirmation page with applicationReference', () => {
      const request = { query: { applicationReference: 'ML-REF-001' } }

      confirmationController.handler(request, mockH)

      expect(mockH.view).toHaveBeenCalledWith(
        'marine-licence/confirmation/index',
        {
          pageTitle:
            'The information relating to your marine licence application has been sent',
          applicationReference: 'ML-REF-001'
        }
      )
    })

    test('throws when applicationReference is missing', () => {
      const request = { query: {} }

      expect(() => confirmationController.handler(request, mockH)).toThrow(
        'Missing application reference number'
      )
    })

    test('throws when applicationReference is empty string', () => {
      const request = { query: { applicationReference: '' } }

      expect(() => confirmationController.handler(request, mockH)).toThrow(
        'Missing application reference number'
      )
    })
  })
})
