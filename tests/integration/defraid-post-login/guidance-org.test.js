import { beforeEach, vi } from 'vitest'
import { setupTestServer } from '~/tests/integration/shared/test-setup-helpers.js'
import { routes } from '~/src/server/common/constants/routes.js'
import { loadPage } from '~/tests/integration/shared/app-server.js'
import { makeGetRequest } from '~/src/server/test-helpers/server-requests.js'
import { getByRole, within } from '@testing-library/dom'
import { postloginUserSession } from '#src/server/common/helpers/defraid-login/session-cache.js'

vi.mock('~/src/server/common/plugins/auth/utils.js')
vi.mock('#src/server/common/helpers/defraid-login/session-cache.js')

describe('Post-login - Organisation Guidance Advice', () => {
  const getServer = setupTestServer()

  beforeEach(() => {
    vi.mocked(postloginUserSession.get).mockImplementation(({ key }) =>
      key === 'confirmEmployee' ? 'organisation' : null
    )
  })

  test('should show guidance page for Organisation Users', async () => {
    const document = await loadPage({
      requestUrl: routes.postLogin.GUIDANCE_ORG,
      server: getServer()
    })

    const pageHeading = within(document).getByRole('heading', {
      level: 1,
      name: 'Exempt activity notification for an organisation'
    })

    expect(pageHeading).toBeInTheDocument()

    const warningText = document.querySelector('.govuk-warning-text__text')
    expect(warningText).toBeInTheDocument()
    expect(warningText.textContent).toContain(
      'If you do not set up your Defra account correctly your exempt activity notification will not be valid. This is because it will not be registered to the organisation the exemption is for.'
    )

    const firstSubheading = within(document).getByRole('heading', {
      level: 3,
      name: 'If the organisation does not have a Defra account'
    })

    expect(firstSubheading).toBeInTheDocument()

    const lists = document.querySelectorAll('ol.govuk-list--number')
    expect(lists).toHaveLength(2)

    const list = lists[0]

    const accountLink = within(list).getByRole('link', {
      name: /Your Defra account/
    })
    expect(accountLink).toBeInTheDocument()
    expect(accountLink).toHaveAttribute('href', '#')
    expect(accountLink).toHaveClass('govuk-link')

    const listLinks = list.querySelectorAll('li')
    expect(listLinks).toHaveLength(4)

    const secondSubheading = within(document).getByRole('heading', {
      level: 3,
      name: 'Get invited to an existing Defra account'
    })

    expect(secondSubheading).toBeInTheDocument()

    const emailLink = within(document).getByRole('link', {
      name: /marine\.consents@marinemanagement\.org\.uk/
    })
    expect(emailLink).toBeInTheDocument()
    expect(emailLink).toHaveAttribute(
      'href',
      'mailto:marine.consents@marinemanagement.org.uk'
    )

    const secondPageHeading = within(document).getByRole('heading', {
      level: 2,
      name: "You're the agent or intermediary for a client organisation"
    })

    expect(secondPageHeading).toBeInTheDocument()

    const thirdSubheading = within(document).getByRole('heading', {
      level: 3,
      name: 'If your client already has a Defra account'
    })

    expect(thirdSubheading).toBeInTheDocument()

    const fourthSubheading = within(document).getByRole('heading', {
      level: 3,
      name: 'If your client does not have a Defra account'
    })

    expect(fourthSubheading).toBeInTheDocument()

    const linksList = document.querySelectorAll('ul.govuk-list')
    expect(linksList).toHaveLength(1)

    const guidanceLinksList = linksList[0]
    const guidanceLinks = guidanceLinksList.querySelectorAll('li')
    expect(guidanceLinks).toHaveLength(2)

    const createAccountLink = within(document).getByRole('link', {
      name: 'How to create a Defra account'
    })
    expect(createAccountLink).toBeInTheDocument()
    expect(createAccountLink).toHaveAttribute(
      'href',
      'https://www.gov.uk/guidance/creating-a-defra-account'
    )

    const addUserLink = within(document).getByRole('link', {
      name: 'How to add users to a Defra account'
    })
    expect(addUserLink).toBeInTheDocument()
    expect(addUserLink).toHaveAttribute(
      'href',
      'https://www.gov.uk/guidance/adding-users-to-a-defra-account-as-an-admin'
    )

    const signOutButton = getByRole(document, 'button', {
      name: 'Sign out'
    })
    expect(signOutButton).toBeInTheDocument()
    expect(signOutButton).toHaveAttribute('href', routes.SIGN_OUT)

    const backLink = getByRole(document, 'link', { name: 'Back' })
    expect(backLink).toBeInTheDocument()
    expect(backLink).toHaveAttribute('href', routes.postLogin.CONFIRM_EMPLOYEE)
  })

  test('should show back link when user came from agent flow', async () => {
    vi.mocked(postloginUserSession.get).mockImplementation(({ key }) =>
      key === 'confirmAgent' ? 'organisation' : null
    )

    const document = await loadPage({
      requestUrl: routes.postLogin.GUIDANCE_ORG,
      server: getServer()
    })

    const backLink = getByRole(document, 'link', { name: 'Back' })
    expect(backLink).toBeInTheDocument()
    expect(backLink).toHaveAttribute('href', routes.postLogin.CONFIRM_AGENT)
  })

  test('should show back link when user came from individual flow', async () => {
    vi.mocked(postloginUserSession.get).mockImplementation(({ key }) =>
      key === 'confirmIndividual' ? 'no' : null
    )

    const document = await loadPage({
      requestUrl: routes.postLogin.GUIDANCE_ORG,
      server: getServer()
    })

    const backLink = getByRole(document, 'link', { name: 'Back' })
    expect(backLink).toBeInTheDocument()
    expect(backLink).toHaveAttribute(
      'href',
      routes.postLogin.CONFIRM_INDIVIDUAL
    )
  })

  test('should redirect to exemption when no relevant session is set', async () => {
    vi.mocked(postloginUserSession.get).mockResolvedValue(null)

    const response = await makeGetRequest({
      url: routes.postLogin.GUIDANCE_ORG,
      server: getServer()
    })

    expect(response.statusCode).toBe(302)
    expect(response.headers.location).toBe(routes.EXEMPTION)
  })
})
