import { beforeEach, vi } from 'vitest'
import {
  guidanceOrgController,
  GUIDANCE_ORG_VIEW_ROUTE
} from '#src/server/defraid-post-login/guidance-org/controller.js'
import { createMockRequest } from '#src/server/test-helpers/mocks/helpers.js'
import { routes } from '#src/server/common/constants/routes.js'
import { postloginUserSession } from '#src/server/common/helpers/defraid-login/session-cache.js'

vi.mock('#src/server/common/helpers/defraid-login/session-cache.js')

describe('#guidanceOrgController', () => {
  const createMockH = () => ({
    redirect: vi.fn().mockReturnThis(),
    view: vi.fn().mockReturnThis(),
    continue: vi.fn()
  })

  beforeEach(() => {
    vi.mocked(postloginUserSession.get).mockImplementation(({ key }) =>
      key === 'confirmEmployee' ? 'organisation' : null
    )
  })

  test('correctly renders page', async () => {
    const request = createMockRequest()
    const h = createMockH()

    await guidanceOrgController.handler(request, h)

    expect(h.view).toHaveBeenCalledWith(GUIDANCE_ORG_VIEW_ROUTE, {
      accountManagementUrl: '#',
      heading: 'Exempt activity notification for an organisation',
      pageTitle: 'Exempt activity notification for an organisation',
      signOutUrl: routes.SIGN_OUT,
      backLink: routes.postLogin.CONFIRM_EMPLOYEE
    })
  })

  test('redirects to when no relevant session data is set', async () => {
    vi.mocked(postloginUserSession.get).mockResolvedValue(null)

    const request = createMockRequest()
    const h = createMockH()

    await guidanceOrgController.handler(request, h)

    expect(h.redirect).toHaveBeenCalledWith(routes.EXEMPTION)
    expect(h.view).not.toHaveBeenCalled()
  })
})
