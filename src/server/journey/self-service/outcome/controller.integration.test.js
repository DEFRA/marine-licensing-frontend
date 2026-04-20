import { JSDOM } from 'jsdom'
import { statusCodes } from '#src/server/common/constants/status-codes.js'
import { setupTestServer } from '#tests/integration/shared/test-setup-helpers.js'
import {
  makeGetRequest,
  makePostRequest
} from '#src/server/test-helpers/server-requests.js'
import { config } from '#src/config/config.js'

describe('#outcomeController (integration)', () => {
  config.set('selfService.enabled', true)
  const getServer = setupTestServer()

  const JOURNEY_SELECT =
    '/journey/self-service/outcome/construction/journey-select'

  const getPage = async (path = JOURNEY_SELECT, headers = {}) => {
    const response = await makeGetRequest({
      url: path,
      server: getServer(),
      headers
    })
    return {
      response,
      document: new JSDOM(response.result).window.document
    }
  }

  const getSessionCookie = (response) => {
    const setCookieHeader = response.headers['set-cookie']
    const sessionCookie = Array.isArray(setCookieHeader)
      ? setCookieHeader[0]
      : setCookieHeader || ''
    return sessionCookie ? { cookie: sessionCookie } : {}
  }

  describe(`GET ${JOURNEY_SELECT}`, () => {
    test('returns 200', async () => {
      const { response } = await getPage()
      expect(response.statusCode).toBe(statusCodes.ok)
    })

    test('renders the H1 from outcome.heading', async () => {
      const { document } = await getPage()
      expect(document.querySelector('h1').textContent).toContain(
        'Marine licence may be required'
      )
    })

    test('renders the section caption', async () => {
      const { document } = await getPage()
      expect(document.querySelector('.govuk-caption-l').textContent).toContain(
        'Construction activity'
      )
    })

    test('renders three option cards', async () => {
      const { document } = await getPage()
      const cards = document.querySelectorAll('.app-iat-option')
      expect(cards).toHaveLength(3)
    })

    test('renders "Option N - <heading>" for each option', async () => {
      const { document } = await getPage()
      const headings = Array.from(
        document.querySelectorAll('.app-iat-option h2')
      ).map((h) => h.textContent.trim())
      expect(headings[0]).toMatch(/^Option 1 - /)
      expect(headings[1]).toMatch(/^Option 2 - /)
      expect(headings[2]).toMatch(/^Option 3 - /)
      expect(headings[2]).toContain('Apply for a standard marine licence')
    })

    test('intermediate options render as POST forms with hidden outcomeType', async () => {
      const { document } = await getPage()
      const forms = document.querySelectorAll(
        '.app-iat-option form[method="POST"]'
      )
      expect(forms).toHaveLength(2)
      const ids = Array.from(forms).map((f) =>
        f.querySelector('input[name="outcomeType"]').getAttribute('value')
      )
      expect(ids).toEqual([
        'WO_CON_EXEMPTION_JOURNEY',
        'WO_CON_SELF_SERVICE_JOURNEY'
      ])
    })

    test('terminal option Continue is a non-submit link with href="#"', async () => {
      const { document } = await getPage()
      const thirdCard = document.querySelectorAll('.app-iat-option')[2]
      expect(thirdCard.querySelector('form[method="POST"]')).toBeNull()
      const continueButton = Array.from(
        thirdCard.querySelectorAll('a.govuk-button')
      ).find((a) => a.textContent.trim() === 'Continue')
      expect(continueButton).not.toBeNull()
      expect(continueButton.getAttribute('href')).toBe('#')
    })

    test('every option card has a "Download a PDF record of my answers" link with href="#"', async () => {
      const { document } = await getPage()
      const cards = document.querySelectorAll('.app-iat-option')
      for (const card of cards) {
        const downloadButton = Array.from(
          card.querySelectorAll('a.govuk-button--secondary')
        ).find((a) =>
          a.textContent.includes('Download a PDF record of my answers')
        )
        expect(downloadButton).not.toBeNull()
        expect(downloadButton.getAttribute('href')).toBe('#')
      }
    })

    test('renders a back link', async () => {
      const { document } = await getPage()
      expect(document.querySelector('.govuk-back-link')).not.toBeNull()
    })

    test('does not render the phase banner', async () => {
      const { document } = await getPage()
      expect(document.querySelector('.govuk-phase-banner')).toBeNull()
    })

    test('does not render navigation links in the header', async () => {
      const { document } = await getPage()
      expect(
        document.querySelector('.govuk-service-navigation__list')
      ).toBeNull()
    })

    test('renders the lead bold and anchor links preserved by sanitiseRichText', async () => {
      const { document } = await getPage()
      const lead = document.querySelector('.govuk-inset-text')
      expect(lead).not.toBeNull()
      expect(lead.querySelector('b')).not.toBeNull()
      const anchors = lead.querySelectorAll('a')
      expect(anchors.length).toBeGreaterThanOrEqual(1)
      for (const a of anchors) {
        expect(a.getAttribute('href')).toMatch(/^https?:\/\//)
      }
    })

    test('returns 404 for an unknown outcome route', async () => {
      const { response } = await getPage(
        '/journey/self-service/outcome/not-an-outcome'
      )
      expect(response.statusCode).toBe(statusCodes.notFound)
    })

    test('returns 404 for a terminal outcome page', async () => {
      const { response } = await getPage(
        '/journey/self-service/outcome/licence-not-required-devolved'
      )
      expect(response.statusCode).toBe(statusCodes.notFound)
    })
  })

  describe(`POST ${JOURNEY_SELECT}`, () => {
    test('redirects to next question with correct session recorded', async () => {
      const response = await makePostRequest({
        url: JOURNEY_SELECT,
        server: getServer(),
        formData: { outcomeType: 'WO_CON_SELF_SERVICE_JOURNEY' }
      })
      expect(response.statusCode).toBe(statusCodes.redirect)
      expect(response.headers.location).toBe(
        '/journey/self-service/construction/activity'
      )
    })

    test('returns 400 for an outcomeType not in this outcome list', async () => {
      const response = await makePostRequest({
        url: JOURNEY_SELECT,
        server: getServer(),
        formData: { outcomeType: 'WO_STANDARD_MLA' }
      })
      expect(response.statusCode).toBe(statusCodes.badRequest)
    })

    test('returns 400 when outcomeType payload is missing (Joi)', async () => {
      const response = await makePostRequest({
        url: JOURNEY_SELECT,
        server: getServer(),
        formData: {}
      })
      expect(response.statusCode).toBe(statusCodes.badRequest)
    })
  })

  describe('end-to-end back navigation across questions and outcomes', () => {
    test('next question after an intermediate outcome has a back link to the outcome', async () => {
      const outcomePost = await makePostRequest({
        url: JOURNEY_SELECT,
        server: getServer(),
        formData: { outcomeType: 'WO_CON_SELF_SERVICE_JOURNEY' }
      })
      const headers = getSessionCookie(outcomePost)

      const { document } = await getPage(
        '/journey/self-service/construction/activity',
        headers
      )
      const backLink = document.querySelector('.govuk-back-link')
      expect(backLink.getAttribute('href')).toBe(JOURNEY_SELECT)
    })

    test('starting a new session clears outcome selections', async () => {
      const outcomePost = await makePostRequest({
        url: JOURNEY_SELECT,
        server: getServer(),
        formData: { outcomeType: 'WO_CON_SELF_SERVICE_JOURNEY' }
      })
      const postHeaders = getSessionCookie(outcomePost)

      const startPost = await makePostRequest({
        url: '/journey/self-service/start',
        server: getServer(),
        formData: {},
        headers: postHeaders
      })
      const startHeaders = getSessionCookie(startPost)

      const { document } = await getPage(
        '/journey/self-service/construction/activity',
        startHeaders
      )
      const backLink = document.querySelector('.govuk-back-link')
      expect(backLink.getAttribute('href')).toBe('/journey/self-service/start')
    })
  })
})
