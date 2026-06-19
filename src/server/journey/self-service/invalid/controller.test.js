import { describe, it, expect, vi } from 'vitest'
import { invalidController } from './controller.js'
import { routes } from '#src/server/common/constants/routes.js'

describe('invalidController (IAT timeout page)', () => {
  it('renders the timeout view with the start url for the Return to start button', () => {
    const view = vi.fn()
    const h = { view }
    invalidController.handler({}, h)
    expect(view).toHaveBeenCalledWith(
      'journey/self-service/invalid/index',
      expect.objectContaining({
        pageTitle: 'Your session has timed out',
        startUrl: routes.IAT_START
      })
    )
  })
})
