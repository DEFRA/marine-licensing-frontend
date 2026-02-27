import { setupTestServer } from '~/tests/integration/shared/test-setup-helpers.js'
import { routes } from '~/src/server/common/constants/routes.js'
import { loadPage } from '~/tests/integration/shared/app-server.js'
import { getByRole, getByText, queryByRole, within } from '@testing-library/dom'
import { beforeAll } from 'vitest'
import {
  citizenUserSession,
  citizenUserSessionWithMultipleRelationships
} from '~/tests/integration/shared/session-fixtures.js'
import { getUserSession } from '~/src/server/common/plugins/auth/utils.js'
import { makePostRequest } from '~/src/server/test-helpers/server-requests.js'
import { JSDOM } from 'jsdom'
import { validateErrors } from '~/tests/integration/shared/expect-utils.js'
import { statusCodes } from '#src/server/common/constants/status-codes.js'

vi.mock('~/src/server/common/plugins/auth/utils.js')

describe('Post-login - Confirm Individual', () => {
  const getServer = setupTestServer()

  beforeAll(() => {
    vi.mocked(getUserSession).mockResolvedValue(citizenUserSession)
  })

  test('should display page for Confirming Individual users', async () => {
    const document = await loadPage({
      requestUrl: routes.postLogin.CONFIRM_INDIVIDUAL,
      server: getServer()
    })
    const pageHeading = within(document).getByRole('heading', {
      level: 1,
      name: `Confirm you're notifying us as ${citizenUserSession.displayName} for a personal project`
    })
    expect(pageHeading).toBeInTheDocument()

    const warningText = document.querySelector('.govuk-warning-text__text')
    expect(warningText).toBeInTheDocument()
    expect(warningText.textContent).toContain(
      "This Defra account is for an individual. This means the exempt activity notification will be in your name personally, not an organisation's name."
    )

    const yesRadio = getByRole(document, 'radio', {
      name: "Yes, I'm notifying you about a personal project"
    })
    const noRadio = getByRole(document, 'radio', {
      name: "No, I'm notifying you for an organisation"
    })

    expect(yesRadio).not.toBeChecked()
    expect(noRadio).not.toBeChecked()
  })

  test('should stay on same page when continue is clicked without selection', async () => {
    const { result } = await makePostRequest({
      url: routes.postLogin.CONFIRM_INDIVIDUAL,
      server: getServer(),
      formData: {}
    })

    const { document } = new JSDOM(result).window

    const pageHeading = within(document).getByRole('heading', {
      level: 1,
      name: `Confirm you're notifying us as ${citizenUserSession.displayName} for a personal project`
    })
    expect(pageHeading).toBeInTheDocument()

    const expectedErrors = [
      {
        field: 'confirmIndividual',
        message: 'Select whether you are notifying us for yourself'
      }
    ]

    validateErrors(expectedErrors, document)

    expect(
      getByText(document, 'Select whether you are notifying us for yourself', {
        selector: '.govuk-error-message'
      })
    ).toBeInTheDocument()
  })

  test('should redirect correctly when user confirms they are individual user', async () => {
    const { headers, statusCode } = await makePostRequest({
      url: routes.postLogin.CONFIRM_INDIVIDUAL,
      server: getServer(),
      formData: { confirmIndividual: 'yes' }
    })

    expect(statusCode).toBe(statusCodes.redirect)
    expect(headers.location).toBe(routes.PROJECT_NAME)
  })

  test('should redirect correctly when user confirms they are not individual user', async () => {
    const { headers, statusCode } = await makePostRequest({
      url: routes.postLogin.CONFIRM_INDIVIDUAL,
      server: getServer(),
      formData: { confirmIndividual: 'no' }
    })

    expect(statusCode).toBe(statusCodes.redirect)
    expect(headers.location).toBe(routes.postLogin.GUIDANCE_ORG)
  })

  test('should not show back link when user does not come from org picker', async () => {
    const document = await loadPage({
      requestUrl: routes.postLogin.CONFIRM_INDIVIDUAL,
      server: getServer()
    })

    const backLink = queryByRole(document, 'link', { name: 'Back' })
    expect(backLink).not.toBeInTheDocument()
  })

  test('should show back link when user comes from org picker', async () => {
    vi.mocked(getUserSession).mockResolvedValue(
      citizenUserSessionWithMultipleRelationships
    )

    const document = await loadPage({
      requestUrl: routes.postLogin.CONFIRM_INDIVIDUAL,
      server: getServer()
    })

    const backLink = document.querySelector('.govuk-back-link')
    expect(backLink).toBeInTheDocument()
    expect(backLink.textContent.trim()).toBe('Back')
  })
})
