import { vi } from 'vitest'
import { JSDOM } from 'jsdom'
import { getByRole, queryByRole, within } from '@testing-library/dom'
import { statusCodes } from '~/src/server/common/constants/status-codes.js'
import { routes } from '~/src/server/common/constants/routes.js'
import { setupTestServer } from '~/tests/integration/shared/test-setup-helpers.js'
import {
  makeGetRequest,
  makePostRequest
} from '~/src/server/test-helpers/server-requests.js'
import { cacheMcmsContextFromQueryParams } from '~/src/server/common/helpers/mcms-context/cache-mcms-context.js'
import { clearExemptionCache } from '~/src/server/common/helpers/exemptions/session-cache/utils.js'

vi.mock('~/src/server/common/helpers/mcms-context/cache-mcms-context.js')
vi.mock('~/src/server/common/helpers/exemptions/session-cache/utils.js')

describe('Who is the exemption for page', () => {
  const getServer = setupTestServer()
  const url = routes.defraIdGuidance.WHO_IS_EXEMPTION_FOR

  beforeEach(() => {
    vi.mocked(cacheMcmsContextFromQueryParams).mockReturnValue(undefined)
    vi.mocked(clearExemptionCache).mockResolvedValue(undefined)
  })

  describe('GET /guidance/who-is-the-exemption-for', () => {
    test('renders page with correct heading', async () => {
      const { result, statusCode } = await makeGetRequest({
        server: getServer(),
        url
      })

      expect(statusCode).toBe(statusCodes.ok)

      const { document } = new JSDOM(result).window

      expect(
        getByRole(document, 'heading', {
          level: 1,
          name: 'Who is this exempt activity notification for?'
        })
      ).toBeInTheDocument()
    })

    test('renders warning text about Defra account setup', async () => {
      const { result, statusCode } = await makeGetRequest({
        server: getServer(),
        url
      })

      expect(statusCode).toBe(statusCodes.ok)

      const { document } = new JSDOM(result).window

      const warningText = document.querySelector('.govuk-warning-text__text')
      expect(warningText).toBeInTheDocument()
      expect(warningText.textContent).toContain(
        'If you do not set up your Defra account correctly, your exempt activity notification will not be valid'
      )
    })

    test('renders three radio options', async () => {
      const { result, statusCode } = await makeGetRequest({
        server: getServer(),
        url
      })

      expect(statusCode).toBe(statusCodes.ok)

      const { document } = new JSDOM(result).window

      const individualRadio = getByRole(document, 'radio', {
        name: 'Myself as an individual - it’s a personal project'
      })
      expect(individualRadio).toBeInTheDocument()
      expect(individualRadio).toHaveAttribute('value', 'individual')

      const organisationRadio = getByRole(document, 'radio', {
        name: 'The organisation I’m an employee of'
      })
      expect(organisationRadio).toBeInTheDocument()
      expect(organisationRadio).toHaveAttribute('value', 'organisation')

      const clientRadio = getByRole(document, 'radio', {
        name: 'A client - you’re an agent or intermediary notifying us on behalf of another organisation'
      })
      expect(clientRadio).toBeInTheDocument()
      expect(clientRadio).toHaveAttribute('value', 'client')
    })

    test('renders Continue button', async () => {
      const { result, statusCode } = await makeGetRequest({
        server: getServer(),
        url
      })

      expect(statusCode).toBe(statusCodes.ok)

      const { document } = new JSDOM(result).window

      const continueButton = getByRole(document, 'button', { name: 'Continue' })
      expect(continueButton).toBeInTheDocument()
    })

    test('does not render back link', async () => {
      const { result, statusCode } = await makeGetRequest({
        server: getServer(),
        url
      })

      expect(statusCode).toBe(statusCodes.ok)

      const { document } = new JSDOM(result).window

      const backLink = queryByRole(document, 'link', { name: 'Back' })
      expect(backLink).not.toBeInTheDocument()
    })

    test('caches MCMS context when Fivium query params present', async () => {
      const urlWithParams = `${url}?ACTIVITY_TYPE=CON&ARTICLE=17`

      await makeGetRequest({
        server: getServer(),
        url: urlWithParams
      })

      expect(cacheMcmsContextFromQueryParams).toHaveBeenCalled()
    })

    test('does not cache MCMS context when Fivium query params absent', async () => {
      await makeGetRequest({
        server: getServer(),
        url
      })

      expect(cacheMcmsContextFromQueryParams).not.toHaveBeenCalled()
    })

    test('clears exemption cache on page load', async () => {
      await makeGetRequest({
        server: getServer(),
        url
      })

      expect(clearExemptionCache).toHaveBeenCalled()
    })

    test('preserves query params in form action', async () => {
      const urlWithParams = `${url}?ACTIVITY_TYPE=CON&ARTICLE=17`

      const { result, statusCode } = await makeGetRequest({
        server: getServer(),
        url: urlWithParams
      })

      expect(statusCode).toBe(statusCodes.ok)

      const { document } = new JSDOM(result).window

      const form = document.querySelector('form')
      expect(form).toBeInTheDocument()
      expect(form.getAttribute('method').toUpperCase()).toBe('POST')
    })
  })

  describe('POST /guidance/who-is-the-exemption-for', () => {
    test('redirects to sign-in when individual selected', async () => {
      const { statusCode, headers } = await makePostRequest({
        server: getServer(),
        url,
        formData: { whoIsExemptionFor: 'individual' }
      })

      expect(statusCode).toBe(statusCodes.redirect)
      expect(headers.location).toBe(routes.SIGNIN)
    })

    test('redirects to check-setup-employee when organisation selected', async () => {
      const { statusCode, headers } = await makePostRequest({
        server: getServer(),
        url,
        formData: { whoIsExemptionFor: 'organisation' }
      })

      expect(statusCode).toBe(statusCodes.redirect)
      expect(headers.location).toBe(routes.defraIdGuidance.CHECK_SETUP_EMPLOYEE)
    })

    test('redirects to check-setup-client when client selected', async () => {
      const { statusCode, headers } = await makePostRequest({
        server: getServer(),
        url,
        formData: { whoIsExemptionFor: 'client' }
      })

      expect(statusCode).toBe(statusCodes.redirect)
      expect(headers.location).toBe(routes.defraIdGuidance.CHECK_SETUP_CLIENT)
    })

    test('shows validation error when no radio selected', async () => {
      const { result, statusCode } = await makePostRequest({
        server: getServer(),
        url,
        formData: {}
      })

      expect(statusCode).toBe(statusCodes.ok)

      const { document } = new JSDOM(result).window

      const errorSummary = getByRole(document, 'alert')
      expect(errorSummary).toBeInTheDocument()

      within(errorSummary).getByRole('heading', {
        level: 2,
        name: 'There is a problem'
      })

      const errorLink = within(errorSummary).getByRole('link', {
        name: 'Select who the exempt activity notification is for'
      })
      expect(errorLink).toBeInTheDocument()
      expect(errorLink).toHaveAttribute('href', '#whoIsExemptionFor')
    })

    test('shows field-level error message when no radio selected', async () => {
      const { result, statusCode } = await makePostRequest({
        server: getServer(),
        url,
        formData: {}
      })

      expect(statusCode).toBe(statusCodes.ok)

      const { document } = new JSDOM(result).window

      const errorMessage = document.querySelector('#whoIsExemptionFor-error')
      expect(errorMessage).toBeInTheDocument()
      expect(errorMessage.textContent).toContain(
        'Select who the exempt activity notification is for'
      )
    })

    test('shows validation error for invalid selection', async () => {
      const { result, statusCode } = await makePostRequest({
        server: getServer(),
        url,
        formData: { whoIsExemptionFor: 'invalid-value' }
      })

      expect(statusCode).toBe(statusCodes.ok)

      const { document } = new JSDOM(result).window

      const errorSummary = getByRole(document, 'alert')
      expect(errorSummary).toBeInTheDocument()

      const errorLink = within(errorSummary).getByRole('link', {
        name: 'Select who the exempt activity notification is for'
      })
      expect(errorLink).toBeInTheDocument()
    })

    test('preserves page heading after validation error', async () => {
      const { result, statusCode } = await makePostRequest({
        server: getServer(),
        url,
        formData: {}
      })

      expect(statusCode).toBe(statusCodes.ok)

      const { document } = new JSDOM(result).window

      expect(
        getByRole(document, 'heading', {
          level: 1,
          name: 'Who is this exempt activity notification for?'
        })
      ).toBeInTheDocument()
    })

    test('preserves warning text after validation error', async () => {
      const { result, statusCode } = await makePostRequest({
        server: getServer(),
        url,
        formData: {}
      })

      expect(statusCode).toBe(statusCodes.ok)

      const { document } = new JSDOM(result).window

      const warningText = document.querySelector('.govuk-warning-text__text')
      expect(warningText).toBeInTheDocument()
      expect(warningText.textContent).toContain(
        'If you do not set up your Defra account correctly'
      )
    })

    test('radio options remain unselected after validation error with no selection', async () => {
      const { result, statusCode } = await makePostRequest({
        server: getServer(),
        url,
        formData: {}
      })

      expect(statusCode).toBe(statusCodes.ok)

      const { document } = new JSDOM(result).window

      const individualRadio = getByRole(document, 'radio', {
        name: 'Myself as an individual - it’s a personal project'
      })
      const organisationRadio = getByRole(document, 'radio', {
        name: 'The organisation I’m an employee of'
      })
      const clientRadio = getByRole(document, 'radio', {
        name: 'A client - you’re an agent or intermediary notifying us on behalf of another organisation'
      })

      expect(individualRadio).not.toBeChecked()
      expect(organisationRadio).not.toBeChecked()
      expect(clientRadio).not.toBeChecked()
    })
  })
})
