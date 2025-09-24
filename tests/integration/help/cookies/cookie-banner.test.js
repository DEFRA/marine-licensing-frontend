import { JSDOM } from 'jsdom'
import { getByRole, queryByRole } from '@testing-library/dom'
import { statusCodes } from '~/src/server/common/constants/status-codes.js'
import { setupTestServer } from '~/tests/integration/shared/test-setup-helpers.js'

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

const expectCookieBanner = (document, shouldBeVisible = true) => {
  const banner = document.querySelector('.govuk-cookie-banner')

  if (shouldBeVisible) {
    expect(banner).toBeInTheDocument()
    expect(banner).toHaveAttribute('role', 'region')
    expect(banner).toHaveAttribute('aria-label', 'Cookie banner')

    const heading = getByRole(banner, 'heading', { level: 2 })
    expect(heading).toHaveTextContent(
      'Cookies on Get permission for marine work'
    )

    const acceptButton = getByRole(banner, 'button', {
      name: 'Accept analytics cookies'
    })
    expect(acceptButton).toHaveAttribute('value', 'yes')

    const rejectButton = getByRole(banner, 'button', {
      name: 'Reject analytics cookies'
    })
    expect(rejectButton).toHaveAttribute('value', 'no')

    const viewCookiesLink = getByRole(banner, 'link', { name: 'View cookies' })
    expect(viewCookiesLink).toHaveAttribute('href', '/help/cookies')
  } else {
    expect(banner).not.toBeInTheDocument()
  }
}

const expectConfirmationBanner = (document, accepted = true) => {
  const banner = document.querySelector('.govuk-cookie-banner')
  expect(banner).toBeInTheDocument()

  const expectedStartText = accepted
    ? 'You’ve accepted analytics cookies. You can'
    : 'You’ve rejected analytics cookies. You can'

  // Check for the text content split across elements
  expect(banner.textContent).toContain(expectedStartText)
  expect(banner.textContent).toContain('at any time.')

  const settingsLink = getByRole(banner, 'link', {
    name: 'change your cookie settings'
  })
  expect(settingsLink).toHaveAttribute('href', '/help/cookies')

  const hideButton = getByRole(banner, 'button', {
    name: 'Hide cookie message'
  })
  expect(hideButton).toBeInTheDocument()

  // Initial banner elements should not be present
  expect(
    queryByRole(banner, 'button', { name: 'Accept analytics cookies' })
  ).not.toBeInTheDocument()
  expect(
    queryByRole(banner, 'button', { name: 'Reject analytics cookies' })
  ).not.toBeInTheDocument()
}

describe('Cookie Banner Integration', () => {
  const getServer = setupTestServer()

  describe('Banner Display Logic', () => {
    test('ML-518-AC1: Should display cookie banner on privacy page when no consent given', async () => {
      const { result, statusCode } = await getServer().inject({
        method: 'GET',
        url: '/help/privacy'
      })

      expect(statusCode).toBe(statusCodes.ok)
      const { document } = new JSDOM(result).window
      expectCookieBanner(document, true)
    })

    test('ML-518-AC1: Should NOT display cookie banner on cookies page itself', async () => {
      const { result, statusCode } = await getServer().inject({
        method: 'GET',
        url: '/help/cookies'
      })

      expect(statusCode).toBe(statusCodes.ok)
      const { document } = new JSDOM(result).window
      expectCookieBanner(document, false)
    })

    test('Should not display banner when user has already accepted cookies', async () => {
      const cookiesPolicy = createCookiesPolicy(true)
      const { result, statusCode } = await getServer().inject({
        method: 'GET',
        url: '/help/privacy',
        headers: { cookie: createCookieHeaders(cookiesPolicy) }
      })

      expect(statusCode).toBe(statusCodes.ok)
      const { document } = new JSDOM(result).window
      expectCookieBanner(document, false)
    })

    test('Should not display banner when user has rejected cookies', async () => {
      const cookiesPolicy = createCookiesPolicy(false)
      const { result, statusCode } = await getServer().inject({
        method: 'GET',
        url: '/help/privacy',
        headers: { cookie: createCookieHeaders(cookiesPolicy) }
      })

      expect(statusCode).toBe(statusCodes.ok)
      const { document } = new JSDOM(result).window
      expectCookieBanner(document, false)
    })
  })

  describe('Banner Submission Workflow', () => {
    test('ML-518-AC2: Should accept cookies from banner and show confirmation', async () => {
      const response = await getServer().inject({
        method: 'POST',
        url: '/help/cookies',
        payload: 'analytics=yes&source=banner&csrfToken=',
        headers: {
          'content-type': 'application/x-www-form-urlencoded',
          referer: 'http://localhost/help/privacy'
        }
      })

      expect(response.statusCode).toBe(statusCodes.redirect)
      expect(response.headers.location).toBe('/help/privacy')

      const setCookieHeaders = response.headers['set-cookie']
      expect(setCookieHeaders).toBeDefined()

      const cookieString = Array.isArray(setCookieHeaders)
        ? setCookieHeaders.join('; ')
        : setCookieHeaders

      // Follow the redirect to see confirmation banner
      const followUpResponse = await getServer().inject({
        method: 'GET',
        url: '/help/privacy',
        headers: { cookie: cookieString }
      })

      const { document } = new JSDOM(followUpResponse.result).window
      expectConfirmationBanner(document, true)
    })

    test('ML-518-AC3: Should reject cookies from banner and show confirmation', async () => {
      const response = await getServer().inject({
        method: 'POST',
        url: '/help/cookies',
        payload: 'analytics=no&source=banner&csrfToken=',
        headers: {
          'content-type': 'application/x-www-form-urlencoded',
          referer: 'http://localhost/help/privacy'
        }
      })

      expect(response.statusCode).toBe(statusCodes.redirect)
      expect(response.headers.location).toBe('/help/privacy')

      const setCookieHeaders = response.headers['set-cookie']
      const cookieString = Array.isArray(setCookieHeaders)
        ? setCookieHeaders.join('; ')
        : setCookieHeaders

      // Follow the redirect to see confirmation banner
      const followUpResponse = await getServer().inject({
        method: 'GET',
        url: '/help/privacy',
        headers: { cookie: cookieString }
      })

      const { document } = new JSDOM(followUpResponse.result).window
      expectConfirmationBanner(document, false)
    })

    test('Should redirect to homepage when no referrer provided', async () => {
      const response = await getServer().inject({
        method: 'POST',
        url: '/help/cookies',
        payload: 'analytics=yes&source=banner&csrfToken=',
        headers: {
          'content-type': 'application/x-www-form-urlencoded'
        }
      })

      expect(response.statusCode).toBe(statusCodes.redirect)
      expect(response.headers.location).toBe('/')
    })
  })

  describe('Banner vs Page Submission Behavior', () => {
    test('Should redirect to referrer when submitted from banner', async () => {
      const response = await getServer().inject({
        method: 'POST',
        url: '/help/cookies',
        payload: 'analytics=yes&source=banner&csrfToken=',
        headers: {
          'content-type': 'application/x-www-form-urlencoded',
          referer: 'http://localhost/help/privacy'
        }
      })

      expect(response.statusCode).toBe(statusCodes.redirect)
      expect(response.headers.location).toBe('/help/privacy')
    })

    test('Should redirect to success page when submitted from cookies page', async () => {
      const response = await getServer().inject({
        method: 'POST',
        url: '/help/cookies',
        payload: 'analytics=yes&source=page&csrfToken=',
        headers: {
          'content-type': 'application/x-www-form-urlencoded',
          referer: 'http://localhost/help/privacy'
        }
      })

      expect(response.statusCode).toBe(statusCodes.redirect)
      expect(response.headers.location).toBe('/help/cookies?success=true')
    })

    test('Should default to page behavior when no source specified', async () => {
      const response = await getServer().inject({
        method: 'POST',
        url: '/help/cookies',
        payload: 'analytics=yes&csrfToken=',
        headers: {
          'content-type': 'application/x-www-form-urlencoded',
          referer: 'http://localhost/help/privacy'
        }
      })

      expect(response.statusCode).toBe(statusCodes.redirect)
      expect(response.headers.location).toBe('/help/cookies?success=true')
    })
  })

  describe('Cookie Policy Data Validation', () => {
    test('Should store correct policy data when accepting analytics', async () => {
      const response = await getServer().inject({
        method: 'POST',
        url: '/help/cookies',
        payload: 'analytics=yes&source=banner&csrfToken=',
        headers: {
          'content-type': 'application/x-www-form-urlencoded'
        }
      })

      const setCookieHeaders = response.headers['set-cookie']
      const policyHeader = Array.isArray(setCookieHeaders)
        ? setCookieHeaders.find((header) => header.includes('cookies_policy='))
        : setCookieHeaders

      expect(policyHeader).toBeDefined()

      const policyValue = policyHeader.split('cookies_policy=')[1].split(';')[0]
      const policyData = JSON.parse(
        Buffer.from(policyValue, 'base64').toString()
      )

      expect(policyData.essential).toBe(true)
      expect(policyData.analytics).toBe(true)
      expect(policyData.timestamp).toBeDefined()
      expect(typeof policyData.timestamp).toBe('number')

      const preferencesHeader = Array.isArray(setCookieHeaders)
        ? setCookieHeaders.find((header) =>
            header.includes('cookies_preferences_set=')
          )
        : setCookieHeaders

      expect(preferencesHeader).toContain('cookies_preferences_set=true')
    })

    test('Should store correct policy data when rejecting analytics', async () => {
      const response = await getServer().inject({
        method: 'POST',
        url: '/help/cookies',
        payload: 'analytics=no&source=banner&csrfToken=',
        headers: {
          'content-type': 'application/x-www-form-urlencoded'
        }
      })

      const setCookieHeaders = response.headers['set-cookie']
      const policyHeader = Array.isArray(setCookieHeaders)
        ? setCookieHeaders.find((header) => header.includes('cookies_policy='))
        : setCookieHeaders

      const policyValue = policyHeader.split('cookies_policy=')[1].split(';')[0]
      const policyData = JSON.parse(
        Buffer.from(policyValue, 'base64').toString()
      )

      expect(policyData.essential).toBe(true)
      expect(policyData.analytics).toBe(false)
      expect(policyData.timestamp).toBeDefined()
    })
  })

  describe('ML-518-AC8: Non-obstructive Behavior', () => {
    test('Should allow navigation to all pages without cookie consent', async () => {
      const testUrls = ['/help/privacy', '/help/cookies']

      for (const url of testUrls) {
        const response = await getServer().inject({
          method: 'GET',
          url
        })

        expect(response.statusCode).toBe(statusCodes.ok)
      }
    })

    test('Should maintain banner visibility across page navigation without consent', async () => {
      const response = await getServer().inject({
        method: 'GET',
        url: '/help/privacy'
      })

      expect(response.statusCode).toBe(statusCodes.ok)
      const { document } = new JSDOM(response.result).window

      // Banner should be visible on privacy page when no consent given
      expectCookieBanner(document, true)
    })
  })

  describe('Banner Form Structure', () => {
    test('Should have correct form attributes and hidden inputs', async () => {
      const { result, statusCode } = await getServer().inject({
        method: 'GET',
        url: '/help/privacy'
      })

      expect(statusCode).toBe(statusCodes.ok)
      const { document } = new JSDOM(result).window

      const banner = document.querySelector('.govuk-cookie-banner')
      expect(banner).toBeInTheDocument()

      const form = banner.querySelector('form')
      expect(form).toBeInTheDocument()
      expect(form).toHaveAttribute('method', 'post')
      expect(form).toHaveAttribute('action', '/help/cookies')
      expect(form).toHaveAttribute('novalidate')

      const sourceInput = form.querySelector('input[name="source"]')
      expect(sourceInput).toBeInTheDocument()
      expect(sourceInput).toHaveAttribute('type', 'hidden')
      expect(sourceInput).toHaveAttribute('value', 'banner')

      const csrfInput = form.querySelector('input[name="csrfToken"]')
      expect(csrfInput).toBeInTheDocument()
      expect(csrfInput).toHaveAttribute('type', 'hidden')
    })

    test('Should have GOV.UK Design System classes', async () => {
      const { result, statusCode } = await getServer().inject({
        method: 'GET',
        url: '/help/privacy'
      })

      expect(statusCode).toBe(statusCodes.ok)
      const { document } = new JSDOM(result).window

      const banner = document.querySelector('.govuk-cookie-banner')
      expect(banner).toHaveClass('govuk-cookie-banner')
      expect(banner).toHaveAttribute('data-module', 'govuk-cookie-banner')

      const acceptButton = getByRole(banner, 'button', {
        name: 'Accept analytics cookies'
      })
      expect(acceptButton).toHaveClass('govuk-button')
      expect(acceptButton).toHaveAttribute('data-module', 'govuk-button')

      const rejectButton = getByRole(banner, 'button', {
        name: 'Reject analytics cookies'
      })
      expect(rejectButton).toHaveClass('govuk-button')
      expect(rejectButton).toHaveAttribute('data-module', 'govuk-button')
    })
  })

  describe('Validation and Error Handling', () => {
    test('Should show validation error for invalid analytics value', async () => {
      const response = await getServer().inject({
        method: 'POST',
        url: '/help/cookies',
        payload: 'analytics=invalid&source=banner&csrfToken=',
        headers: {
          'content-type': 'application/x-www-form-urlencoded'
        }
      })

      expect(response.statusCode).toBe(statusCodes.ok) // Returns validation error page
      expect(response.result).toContain('Error:')
    })

    test('Should only accept "yes" or "no" for analytics parameter', async () => {
      const validValues = ['yes', 'no']
      const invalidValues = ['YES', 'No', 'true', 'false', '1', '0', 'invalid']

      for (const value of validValues) {
        const response = await getServer().inject({
          method: 'POST',
          url: '/help/cookies',
          payload: `analytics=${value}&source=banner&csrfToken=`,
          headers: {
            'content-type': 'application/x-www-form-urlencoded'
          }
        })
        expect(response.statusCode).toBe(statusCodes.redirect)
      }

      for (const value of invalidValues) {
        const response = await getServer().inject({
          method: 'POST',
          url: '/help/cookies',
          payload: `analytics=${value}&source=banner&csrfToken=`,
          headers: {
            'content-type': 'application/x-www-form-urlencoded'
          }
        })
        expect(response.statusCode).toBe(statusCodes.ok) // Validation error
      }
    })
  })
})
