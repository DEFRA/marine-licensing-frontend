import { describe, it, expect, vi } from 'vitest'
import { invalidController } from './controller.js'
import { routes } from '#src/server/common/constants/routes.js'

describe('invalidController', () => {
  it('renders the invalid-journey view with a Start-again link', () => {
    const view = vi.fn()
    const h = { view }
    invalidController.handler({}, h)
    expect(view).toHaveBeenCalledWith(
      'journey/self-service/invalid/index',
      expect.objectContaining({
        pageTitle: expect.stringMatching(/expired|invalid|could not be found/i),
        startUrl: routes.IAT_START
      })
    )
  })
})
