import { vi } from 'vitest'
import { confirmationController } from './controller.js'

describe('confirmationController', () => {
  const mockH = { view: vi.fn() }

  describe('handler', () => {
    test('renders confirmation page with applicationReference', () => {
      const request = { query: { applicationReference: 'ML-REF-001' } }

      confirmationController.handler(request, mockH)

      expect(mockH.view).toHaveBeenCalledWith(
        'marine-licence/confirmation/index',
        {
          pageTitle: 'Application sent',
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
