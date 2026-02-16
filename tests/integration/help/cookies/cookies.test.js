import { JSDOM } from 'jsdom'
import { getByRole, getByText, within } from '@testing-library/dom'
import { statusCodes } from '~/src/server/common/constants/status-codes.js'
import { setupTestServer } from '~/tests/integration/shared/test-setup-helpers.js'

import {
  makeGetRequest,
  makePostRequest
} from '~/src/server/test-helpers/server-requests.js'

const createCookiesPolicy = (analytics = false, timestamp = 1704040000) => ({
  essential: true,
  analytics,
  timestamp
})

const createCookieHeaders = (cookiesPolicy, preferencesSet = true) => {
  const policyHeader = `cookies_policy=${Buffer.from(JSON.stringify(cookiesPolicy)).toString('base64')}`
  const preferencesHeader = `cookies_preferences_set=${preferencesSet}`
  return `${policyHeader}; ${preferencesHeader}`
}

const expectRadioSelection = (document, analytics) => {
  const yesRadio = getByRole(document, 'radio', { name: 'Yes' })
  const noRadio = getByRole(document, 'radio', { name: 'No' })

  if (analytics) {
    expect(yesRadio).toBeChecked()
    expect(noRadio).not.toBeChecked()
  } else {
    expect(noRadio).toBeChecked()
    expect(yesRadio).not.toBeChecked()
  }
}

const expectCookiesInResponse = (response) => {
  expect(response.statusCode).toBe(statusCodes.redirect)
  expect(response.headers.location).toBe('/help/cookies?success=true')

  const setCookieHeaders = response.headers['set-cookie']
  expect(setCookieHeaders).toBeDefined()

  const cookieString = Array.isArray(setCookieHeaders)
    ? setCookieHeaders.join('; ')
    : setCookieHeaders

  expect(cookieString).toContain('cookies_policy=')
  expect(cookieString).toContain('cookies_preferences_set=true')
}

describe('Cookies page', () => {
  const getServer = setupTestServer()

  describe('GET /help/cookies', () => {
    test('AC1: Should navigate to cookies page from footer link', async () => {
      const { result, statusCode } = await makeGetRequest({
        server: getServer(),
        url: '/help/cookies'
      })

      expect(statusCode).toBe(statusCodes.ok)

      const { document } = new JSDOM(result).window

      expect(
        getByRole(document, 'heading', {
          level: 1,
          name: 'Cookies on Get permission for marine work'
        })
      ).toBeInTheDocument()
    })

    test('AC2: Should display all cookie types with "No" selected when no decision made', async () => {
      const { result, statusCode } = await makeGetRequest({
        server: getServer(),
        url: '/help/cookies'
      })

      expect(statusCode).toBe(statusCodes.ok)

      const { document } = new JSDOM(result).window

      expect(
        getByRole(document, 'heading', {
          level: 2,
          name: 'Essential cookies'
        })
      ).toBeInTheDocument()

      expect(
        getByRole(document, 'heading', {
          level: 2,
          name: 'Analytics cookies (optional)'
        })
      ).toBeInTheDocument()

      const tables = document.querySelectorAll('.govuk-table')
      expect(tables.length).toBeGreaterThanOrEqual(2)

      expect(getByText(document, 'marineLicensingSession')).toBeInTheDocument()
      expect(getByText(document, 'userSession')).toBeInTheDocument()
      expect(getByText(document, 'csrfToken')).toBeInTheDocument()
      expect(getByText(document, 'cookies_preferences_set')).toBeInTheDocument()
      expect(getByText(document, 'cookies_policy')).toBeInTheDocument()

      expect(
        getByRole(document, 'heading', {
          level: 3,
          name: 'Microsoft Clarity'
        })
      ).toBeInTheDocument()

      // Verify "No" is selected by default
      expectRadioSelection(document, false)
    })

    test('AC3: Should display "No" selected when analytics cookies not accepted', async () => {
      const cookiesPolicy = createCookiesPolicy(false)
      const { result, statusCode } = await makeGetRequest({
        server: getServer(),
        url: '/help/cookies',
        headers: { cookie: createCookieHeaders(cookiesPolicy) }
      })

      expect(statusCode).toBe(statusCodes.ok)
      const { document } = new JSDOM(result).window
      expectRadioSelection(document, false)
    })

    test('AC4: Should display "Yes" selected when analytics cookies accepted', async () => {
      const cookiesPolicy = createCookiesPolicy(true)
      const { result, statusCode } = await makeGetRequest({
        server: getServer(),
        url: '/help/cookies',
        headers: { cookie: createCookieHeaders(cookiesPolicy) }
      })

      expect(statusCode).toBe(statusCodes.ok)
      const { document } = new JSDOM(result).window
      expectRadioSelection(document, true)
    })

    test('AC7: Should show back link that goes to previous page', async () => {
      const { result, statusCode } = await makeGetRequest({
        server: getServer(),
        url: '/help/cookies',
        headers: {
          referer: 'http://localhost/exemption/task-list'
        }
      })

      expect(statusCode).toBe(statusCodes.ok)

      const { document } = new JSDOM(result).window

      const backLink = getByRole(document, 'link', { name: 'Back' })
      expect(backLink).toBeInTheDocument()
      expect(backLink).toHaveAttribute('href', '/exemption/task-list')
    })

    test('Should not show back link to cookies page itself', async () => {
      const { result, statusCode } = await makeGetRequest({
        server: getServer(),
        url: '/help/cookies',
        headers: {
          referer: 'http://localhost/help/cookies'
        }
      })

      expect(statusCode).toBe(statusCodes.ok)

      const { document } = new JSDOM(result).window

      const backLink = getByRole(document, 'link', { name: 'Back' })
      expect(backLink).toBeInTheDocument()
      expect(backLink).toHaveAttribute('href', '/')
    })

    test('Should show success banner when returning from save', async () => {
      const { result, statusCode } = await makeGetRequest({
        server: getServer(),
        url: '/help/cookies?success=true'
      })

      expect(statusCode).toBe(statusCodes.ok)

      const { document } = new JSDOM(result).window

      const banner = document.querySelector(
        '.govuk-notification-banner--success'
      )
      expect(banner).toBeInTheDocument()

      expect(
        getByText(banner, /Your cookie preferences were saved/)
      ).toBeInTheDocument()

      const returnLink = within(banner).getByRole('link', {
        name: 'Go back to the previous page'
      })
      expect(returnLink).toBeInTheDocument()
    })

    test('AC10: Should not show Sign Out link for unauthenticated users', async () => {
      const { result, statusCode } = await makeGetRequest({
        server: getServer(),
        url: '/help/cookies'
      })

      expect(statusCode).toBe(statusCodes.ok)

      const { document } = new JSDOM(result).window

      const signOutLink = document.querySelector('a[href*="sign-out"]')
      expect(signOutLink).not.toBeInTheDocument()
    })
  })

  describe('POST /help/cookies', () => {
    const postTestCases = [
      {
        name: 'AC5: Should accept analytics cookies and redirect with success',
        analytics: 'yes'
      },
      {
        name: 'AC6: Should reject analytics cookies and redirect with success',
        analytics: 'no'
      }
    ]

    postTestCases.forEach(({ name, analytics }) => {
      test(`${name}`, async () => {
        const response = await makePostRequest({
          server: getServer(),
          url: '/help/cookies',
          formData: `analytics=${analytics}&csrfToken=`,
          headers: {
            'content-type': 'application/x-www-form-urlencoded'
          }
        })

        expectCookiesInResponse(response)
      })
    })

    test('Should show validation error when no radio button selected', async () => {
      const response = await makePostRequest({
        server: getServer(),
        url: '/help/cookies',
        formData: 'csrfToken=',
        headers: {
          'content-type': 'application/x-www-form-urlencoded'
        }
      })

      expect(response.statusCode).toBe(statusCodes.ok)

      const { document } = new JSDOM(response.result).window

      const errorSummary = document.querySelector('.govuk-error-summary')
      expect(errorSummary).toBeInTheDocument()

      const errorLink = getByRole(errorSummary, 'link', {
        name: 'Select yes if you want to accept analytics cookies'
      })
      expect(errorLink).toBeInTheDocument()
      expect(errorLink).toHaveAttribute('href', '#analytics')

      const errorMessage = document.querySelector('.govuk-error-message')
      expect(errorMessage).toBeInTheDocument()
      expect(errorMessage).toHaveTextContent(
        'Error: Select yes if you want to accept analytics cookies'
      )

      const analyticsFormGroup = document.querySelector('#analytics')
      expect(analyticsFormGroup).toBeInTheDocument()

      const yesRadio = getByRole(document, 'radio', { name: 'Yes' })
      const noRadio = getByRole(document, 'radio', { name: 'No' })
      expect(yesRadio).not.toBeChecked()
      expect(noRadio).not.toBeChecked()
    })
  })

  describe('Cookie preferences functionality', () => {
    test('AC9: Should show correct back link on confirmation page', async () => {
      // Navigate to cookies page from a specific page
      const getResponse = await makeGetRequest({
        server: getServer(),
        url: '/help/cookies',
        headers: { referer: 'http://localhost/exemption/site-name' }
      })

      const sessionCookie = Array.isArray(getResponse.headers['set-cookie'])
        ? getResponse.headers['set-cookie'][0]
        : getResponse.headers['set-cookie'] || ''

      // Save preferences
      const postResponse = await makePostRequest({
        server: getServer(),
        url: '/help/cookies',
        formData: 'analytics=yes&csrfToken=',
        headers: {
          cookie: sessionCookie,
          'content-type': 'application/x-www-form-urlencoded'
        }
      })

      expectCookiesInResponse(postResponse)

      // Check success page shows return link
      const postCookies = Array.isArray(postResponse.headers['set-cookie'])
        ? postResponse.headers['set-cookie'][0]
        : postResponse.headers['set-cookie'] || ''

      const allCookies = [sessionCookie, postCookies]
        .filter((c) => c)
        .join('; ')

      const successResponse = await makeGetRequest({
        server: getServer(),
        url: postResponse.headers.location,
        headers: { cookie: allCookies }
      })

      const { document } = new JSDOM(successResponse.result).window
      const banner = document.querySelector(
        '.govuk-notification-banner--success'
      )
      expect(banner).toBeInTheDocument()

      const returnLink = within(banner).getByRole('link', {
        name: 'Go back to the previous page'
      })
      expect(returnLink).toBeInTheDocument()
      expect(returnLink.getAttribute('href')).toBe('/exemption/site-name')
    })
  })

  describe('Form elements', () => {
    test('Should have correct form elements', async () => {
      const { result, statusCode } = await makeGetRequest({
        server: getServer(),
        url: '/help/cookies'
      })

      expect(statusCode).toBe(statusCodes.ok)

      const { document } = new JSDOM(result).window

      const fieldset = document.querySelector('fieldset')
      expect(fieldset).toBeInTheDocument()

      const legend = within(fieldset).getByText(
        'Do you want to accept analytics cookies?'
      )
      expect(legend).toBeInTheDocument()

      const saveButton = getByRole(document, 'button', {
        name: 'Save cookie settings'
      })
      expect(saveButton).toBeInTheDocument()
      expect(saveButton).toHaveAttribute('type', 'submit')

      const form = document.querySelector('form')
      expect(form).toHaveAttribute('method', 'post')
      expect(form).toHaveAttribute('novalidate')
    })
  })
})
