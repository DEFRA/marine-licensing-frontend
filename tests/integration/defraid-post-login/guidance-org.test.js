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
      'If you do not set up your Defra account correctly your exempt activity notification will not be valid. This is because it will not be registered to the person the exemption is for.'
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

    const linksList = document.querySelectorAll('ul.govuk-list')
    expect(linksList).toHaveLength(2)

    const listOfLinks = linksList[0]

    const emailLink = within(listOfLinks).getByRole('link')
    expect(emailLink).toBeInTheDocument()
    expect(emailLink).toHaveAttribute(
      'href',
      'mailto:Customer.Identity-Support@defra.gov.uk'
    )

    const callCharges = within(document).getByRole('link', {
      name: /Find out about call charges/
    })
    expect(callCharges).toBeInTheDocument()

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

    const creteAccountListLinks = lists[1].querySelectorAll('li')
    expect(creteAccountListLinks).toHaveLength(4)

    const signOutButton = getByRole(document, 'button', {
      name: 'Sign out'
    })
    expect(signOutButton).toBeInTheDocument()
    expect(signOutButton).toHaveAttribute('href', routes.SIGN_OUT)
  })

  test('should show back link when user came from employee flow', async () => {
    vi.mocked(postloginUserSession.get).mockImplementation(({ key }) =>
      key === 'confirmEmployee' ? 'organisation' : null
    )

    const document = await loadPage({
      requestUrl: routes.postLogin.GUIDANCE_ORG,
      server: getServer()
    })

    const backLink = document.querySelector('.govuk-back-link')
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

    const backLink = document.querySelector('.govuk-back-link')
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

    const backLink = document.querySelector('.govuk-back-link')
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
