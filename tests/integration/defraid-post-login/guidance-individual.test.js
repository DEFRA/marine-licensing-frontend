import { beforeEach, vi } from 'vitest'
import { setupTestServer } from '~/tests/integration/shared/test-setup-helpers.js'
import { routes } from '~/src/server/common/constants/routes.js'
import { loadPage } from '~/tests/integration/shared/app-server.js'
import { makeGetRequest } from '~/src/server/test-helpers/server-requests.js'
import { getByRole, within } from '@testing-library/dom'
import { postloginUserSession } from '#src/server/common/helpers/defraid-login/session-cache.js'

vi.mock('~/src/server/common/plugins/auth/utils.js')
vi.mock('#src/server/common/helpers/defraid-login/session-cache.js')

describe('Post-login - Individual Guidance Advice', () => {
  const getServer = setupTestServer()

  beforeEach(() => {
    vi.mocked(postloginUserSession.get).mockImplementation(({ key }) =>
      key === 'confirmEmployee' ? 'personal' : null
    )
  })

  test('should show guidance page for Individual Users', async () => {
    const document = await loadPage({
      requestUrl: routes.postLogin.GUIDANCE_INDIVIDUAL,
      server: getServer()
    })

    const pageHeading = within(document).getByRole('heading', {
      level: 1,
      name: `Exempt activity notification for an individual`
    })

    expect(pageHeading).toBeInTheDocument()

    const warningText = document.querySelector('.govuk-warning-text__text')
    expect(warningText).toBeInTheDocument()
    expect(warningText.textContent).toContain(
      'If you do not set up your Defra account correctly your exempt activity notification will not be valid. This is because it will not be registered to the person the exemption is for.'
    )

    const lists = document.querySelectorAll('ol.govuk-list--number')
    expect(lists).toHaveLength(1)

    const list = lists[0]

    const accountLink = within(list).getByRole('link', {
      name: /Your Defra account/
    })
    expect(accountLink).toBeInTheDocument()
    expect(accountLink).toHaveAttribute('href', '#')
    expect(accountLink).toHaveClass('govuk-link')

    const listLinks = list.querySelectorAll('li')
    expect(listLinks).toHaveLength(4)

    const continueButton = getByRole(document, 'button', {
      name: 'Go to your Defra account'
    })
    expect(continueButton).toHaveAttribute('href', '#')
  })

  test('should show back link to confirm-employee when user came from employee flow', async () => {
    vi.mocked(postloginUserSession.get).mockImplementation(({ key }) =>
      key === 'confirmEmployee' ? 'personal' : null
    )

    const document = await loadPage({
      requestUrl: routes.postLogin.GUIDANCE_INDIVIDUAL,
      server: getServer()
    })

    const backLink = document.querySelector('.govuk-back-link')
    expect(backLink).toBeInTheDocument()
    expect(backLink).toHaveAttribute('href', routes.postLogin.CONFIRM_EMPLOYEE)
  })

  test('should show back link to confirm-agent when user came from agent flow', async () => {
    vi.mocked(postloginUserSession.get).mockImplementation(({ key }) =>
      key === 'confirmAgent' ? 'personal' : null
    )

    const document = await loadPage({
      requestUrl: routes.postLogin.GUIDANCE_INDIVIDUAL,
      server: getServer()
    })

    const backLink = document.querySelector('.govuk-back-link')
    expect(backLink).toBeInTheDocument()
    expect(backLink).toHaveAttribute('href', routes.postLogin.CONFIRM_AGENT)
  })

  test('should redirect to exemption when neither confirmEmployee nor confirmAgent is set', async () => {
    vi.mocked(postloginUserSession.get).mockResolvedValue(null)

    const response = await makeGetRequest({
      url: routes.postLogin.GUIDANCE_INDIVIDUAL,
      server: getServer()
    })

    expect(response.statusCode).toBe(302)
    expect(response.headers.location).toBe(routes.EXEMPTION)
  })
})
