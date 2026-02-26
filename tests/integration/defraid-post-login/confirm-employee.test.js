import { setupTestServer } from '~/tests/integration/shared/test-setup-helpers.js'
import { routes } from '~/src/server/common/constants/routes.js'
import { loadPage } from '~/tests/integration/shared/app-server.js'
import { getByRole, getByText, queryByRole, within } from '@testing-library/dom'
import { beforeAll, beforeEach } from 'vitest'
import {
  employeeSession,
  employeeSessionWithMultipleOrgs
} from '~/tests/integration/shared/session-fixtures.js'
import { getUserSession } from '~/src/server/common/plugins/auth/utils.js'
import { makePostRequest } from '~/src/server/test-helpers/server-requests.js'
import { JSDOM } from 'jsdom'
import { validateErrors } from '~/tests/integration/shared/expect-utils.js'
import { statusCodes } from '#src/server/common/constants/status-codes.js'

vi.mock('~/src/server/common/plugins/auth/utils.js')

describe('Post-login - Confirm Employee', () => {
  const getServer = setupTestServer()

  beforeAll(() => {
    vi.mocked(getUserSession).mockResolvedValue(employeeSession)
  })

  beforeEach(() => {
    vi.mocked(getUserSession).mockResolvedValue(employeeSession)
  })

  test('should display page for Confirming Employee users', async () => {
    const document = await loadPage({
      requestUrl: routes.postLogin.CONFIRM_EMPLOYEE,
      server: getServer()
    })
    const pageHeading = within(document).getByRole('heading', {
      level: 1,
      name: `Are you notifying us as an employee of ${employeeSession.organisationName}?`
    })
    expect(pageHeading).toBeInTheDocument()

    const yesRadio = getByRole(document, 'radio', {
      name: 'Yes, the exempt activity notification is for Test Org'
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
      requestUrl: routes.postLogin.CONFIRM_EMPLOYEE,
      server: getServer()
    })

    const backLink = queryByRole(document, 'link', { name: 'Back' })
    expect(backLink).not.toBeInTheDocument()
  })

  test('should show back link when user comes from org picker', async () => {
    vi.mocked(getUserSession).mockResolvedValue(employeeSessionWithMultipleOrgs)

    const document = await loadPage({
      requestUrl: routes.postLogin.CONFIRM_EMPLOYEE,
      server: getServer()
    })

    const backLink = document.querySelector('.govuk-back-link')
    expect(backLink).toBeInTheDocument()
    expect(backLink.textContent.trim()).toBe('Back')
  })

  test('should stay on same page when continue is clicked without selection', async () => {
    const { result } = await makePostRequest({
      url: routes.postLogin.CONFIRM_EMPLOYEE,
      server: getServer(),
      formData: {}
    })

    const { document } = new JSDOM(result).window

    const pageHeading = within(document).getByRole('heading', {
      level: 1,
      name: `Are you notifying us as an employee of ${employeeSession.organisationName}?`
    })
    expect(pageHeading).toBeInTheDocument()

    const expectedErrors = [
      {
        field: 'confirmEmployee',
        message: 'Select whether you are notifying us for Test Org'
      }
    ]

    validateErrors(expectedErrors, document)

    expect(
      getByText(document, 'Select whether you are notifying us for Test Org', {
        selector: '.govuk-error-message'
      })
    ).toBeInTheDocument()
  })

  test('should redirect correctly when user confirms they are employee user', async () => {
    const { headers, statusCode } = await makePostRequest({
      url: routes.postLogin.CONFIRM_EMPLOYEE,
      server: getServer(),
      formData: { confirmEmployee: 'yes' }
    })

    expect(statusCode).toBe(statusCodes.redirect)
    expect(headers.location).toBe(routes.PROJECT_NAME)
  })

  test('should redirect correctly when user confirms they are not employee of this company', async () => {
    const { headers, statusCode } = await makePostRequest({
      url: routes.postLogin.CONFIRM_EMPLOYEE,
      server: getServer(),
      formData: { confirmEmployee: 'organisation' }
    })

    expect(statusCode).toBe(statusCodes.redirect)
    expect(headers.location).toBe(routes.postLogin.GUIDANCE_ORG)
  })

  test('should redirect correctly when user confirms they are not employee user', async () => {
    const { headers, statusCode } = await makePostRequest({
      url: routes.postLogin.CONFIRM_EMPLOYEE,
      server: getServer(),
      formData: { confirmEmployee: 'personal' }
    })

    expect(statusCode).toBe(statusCodes.redirect)
    expect(headers.location).toBe(routes.postLogin.GUIDANCE_INDIVIDUAL)
  })
})
