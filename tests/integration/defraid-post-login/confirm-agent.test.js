import { setupTestServer } from '~/tests/integration/shared/test-setup-helpers.js'
import { routes } from '~/src/server/common/constants/routes.js'
import { loadPage } from '~/tests/integration/shared/app-server.js'
import { getByRole, getByText, queryByRole, within } from '@testing-library/dom'
import { beforeAll, beforeEach } from 'vitest'
import {
  agentSession,
  agentSessionWithMultipleOrgs
} from '~/tests/integration/shared/session-fixtures.js'
import { getUserSession } from '~/src/server/common/plugins/auth/utils.js'
import { makePostRequest } from '~/src/server/test-helpers/server-requests.js'
import { JSDOM } from 'jsdom'
import { validateErrors } from '~/tests/integration/shared/expect-utils.js'
import { statusCodes } from '#src/server/common/constants/status-codes.js'

vi.mock('~/src/server/common/plugins/auth/utils.js')

describe('Post-login - Confirm Agent', () => {
  const getServer = setupTestServer()

  beforeAll(() => {
    vi.mocked(getUserSession).mockResolvedValue(agentSession)
  })

  beforeEach(() => {
    vi.mocked(getUserSession).mockResolvedValue(agentSession)
  })

  test('should display page for Confirming Agent users', async () => {
    const document = await loadPage({
      requestUrl: routes.postLogin.CONFIRM_AGENT,
      server: getServer()
    })
    const pageHeading = within(document).getByRole('heading', {
      level: 1,
      name: `Are you notifying us as an agent or intermediary for ${agentSession.organisationName}?`
    })
    expect(pageHeading).toBeInTheDocument()

    const yesRadio = getByRole(document, 'radio', {
      name: 'Yes, this exempt activity notification is for Client Org'
    })

    const noFirstRadio = getByRole(document, 'radio', {
      name: "No, I'm notifying you for a different organisation"
    })

    const noSecondRadio = getByRole(document, 'radio', {
      name: "No, I'm notifying you about a personal project"
    })

    expect(yesRadio).not.toBeChecked()
    expect(noFirstRadio).not.toBeChecked()
    expect(noSecondRadio).not.toBeChecked()
  })

  test('should not show back link when user does not come from org picker', async () => {
    const document = await loadPage({
      requestUrl: routes.postLogin.CONFIRM_AGENT,
      server: getServer()
    })

    const backLink = queryByRole(document, 'link', { name: 'Back' })
    expect(backLink).not.toBeInTheDocument()
  })

  test('should show back link when user comes from org picker', async () => {
    vi.mocked(getUserSession).mockResolvedValue(agentSessionWithMultipleOrgs)

    const document = await loadPage({
      requestUrl: routes.postLogin.CONFIRM_AGENT,
      server: getServer()
    })

    const backLink = document.querySelector('.govuk-back-link')
    expect(backLink).toBeInTheDocument()
    expect(backLink.textContent.trim()).toBe('Back')
  })

  test('should stay on same page when continue is clicked without selection', async () => {
    const { result } = await makePostRequest({
      url: routes.postLogin.CONFIRM_AGENT,
      server: getServer(),
      formData: {}
    })

    const { document } = new JSDOM(result).window

    const pageHeading = within(document).getByRole('heading', {
      level: 1,
      name: `Are you notifying us as an agent or intermediary for ${agentSession.organisationName}?`
    })
    expect(pageHeading).toBeInTheDocument()

    const expectedErrors = [
      {
        field: 'confirmAgent',
        message: 'Select whether you are notifying us for Client Org'
      }
    ]

    validateErrors(expectedErrors, document)

    expect(
      getByText(
        document,
        'Select whether you are notifying us for Client Org',
        {
          selector: '.govuk-error-message'
        }
      )
    ).toBeInTheDocument()
  })

  test('should redirect correctly when user confirms they are agent user', async () => {
    const { headers, statusCode } = await makePostRequest({
      url: routes.postLogin.CONFIRM_AGENT,
      server: getServer(),
      formData: { confirmAgent: 'yes' }
    })

    expect(statusCode).toBe(statusCodes.redirect)
    expect(headers.location).toBe(routes.PROJECT_NAME)
  })

  test('should redirect correctly when user confirms they are not agent of this company', async () => {
    const { headers, statusCode } = await makePostRequest({
      url: routes.postLogin.CONFIRM_AGENT,
      server: getServer(),
      formData: { confirmAgent: 'organisation' }
    })

    expect(statusCode).toBe(statusCodes.redirect)
    expect(headers.location).toBe(routes.postLogin.GUIDANCE_ORG)
  })

  test('should redirect correctly when user confirms they are not agent user', async () => {
    const { headers, statusCode } = await makePostRequest({
      url: routes.postLogin.CONFIRM_AGENT,
      server: getServer(),
      formData: { confirmAgent: 'personal' }
    })

    expect(statusCode).toBe(statusCodes.redirect)
    expect(headers.location).toBe(routes.postLogin.GUIDANCE_INDIVIDUAL)
  })
})
