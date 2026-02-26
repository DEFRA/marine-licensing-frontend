import { beforeEach, vi } from 'vitest'
import {
  guidanceIndividualController,
  GUIDANCE_INDIVIDUAL_VIEW_ROUTE
} from '#src/server/defraid-post-login/guidance-individual/controller.js'
import { createMockRequest } from '#src/server/test-helpers/mocks/helpers.js'
import { routes } from '#src/server/common/constants/routes.js'
import { postloginUserSession } from '#src/server/common/helpers/defraid-login/session-cache.js'

vi.mock('#src/server/common/helpers/defraid-login/session-cache.js')

describe('#guidanceIndividualController', () => {
  const createMockH = () => ({
    redirect: vi.fn().mockReturnThis(),
    view: vi.fn().mockReturnThis(),
    continue: vi.fn()
  })

  beforeEach(() => {
    vi.mocked(postloginUserSession.get).mockImplementation(({ key }) =>
      key === 'confirmEmployee' ? 'personal' : null
    )
  })

  test('correctly renders page for agent user', async () => {
    vi.mocked(postloginUserSession.get).mockImplementation(({ key }) =>
      key === 'confirmAgent' ? 'personal' : null
    )

    const request = createMockRequest()
    const h = createMockH()

    await guidanceIndividualController.handler(request, h)

    expect(h.view).toHaveBeenCalledWith(GUIDANCE_INDIVIDUAL_VIEW_ROUTE, {
      accountManagementUrl: '#',
      heading: 'Exempt activity notification for an individual',
      pageTitle: 'Exempt activity notification for an individual',
      backLink: routes.postLogin.CONFIRM_AGENT
    })
  })

  test('correctly renders page for employee user', async () => {
    const request = createMockRequest()
    const h = createMockH()

    await guidanceIndividualController.handler(request, h)

    expect(h.view).toHaveBeenCalledWith(GUIDANCE_INDIVIDUAL_VIEW_ROUTE, {
      accountManagementUrl: '#',
      heading: 'Exempt activity notification for an individual',
      pageTitle: 'Exempt activity notification for an individual',
      backLink: routes.postLogin.CONFIRM_EMPLOYEE
    })
  })

  test('redirects to EXEMPTION when neither confirmEmployee nor confirmAgent is set', async () => {
    vi.mocked(postloginUserSession.get).mockResolvedValue(null)

    const request = createMockRequest()
    const h = createMockH()

    await guidanceIndividualController.handler(request, h)

    expect(h.redirect).toHaveBeenCalledWith(routes.EXEMPTION)
    expect(h.view).not.toHaveBeenCalled()
  })
})
