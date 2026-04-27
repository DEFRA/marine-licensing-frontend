import { JSDOM } from 'jsdom'
import { statusCodes } from '#src/server/common/constants/status-codes.js'
import { setupTestServer } from '#tests/integration/shared/test-setup-helpers.js'
import {
  makeGetRequest,
  makePostRequest
} from '#src/server/test-helpers/server-requests.js'
import { config } from '#src/config/config.js'

describe('#questionController (integration)', () => {
  config.set('selfService.enabled', true)
  const getServer = setupTestServer()

  const getPage = async (path = '/journey/self-service/sea', headers = {}) => {
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

  const postPage = async (path, formData = {}, headers = {}) => {
    const response = await makePostRequest({
      url: path,
      server: getServer(),
      formData,
      headers
    })
    return {
      response,
      document: new JSDOM(response.result).window.document
    }
  }

  describe('GET /journey/self-service/sea', () => {
    test('returns 200', async () => {
      const { response } = await getPage()
      expect(response.statusCode).toBe(statusCodes.ok)
    })

    test('renders the question heading', async () => {
      const { document } = await getPage()
      const legend = document.querySelector('.govuk-fieldset__legend')
      expect(legend.textContent).toContain(
        'Where will the activity take place?'
      )
    })

    test('renders section caption', async () => {
      const { document } = await getPage()
      const caption = document.querySelector('.govuk-caption-l')
      expect(caption.textContent).toContain('Jurisdiction check')
    })

    test('renders radio buttons for each answer', async () => {
      const { document } = await getPage()
      const radios = document.querySelectorAll('input[type="radio"]')
      expect(radios.length).toBe(5)
    })

    test('renders a Continue button', async () => {
      const { document } = await getPage()
      const buttons = Array.from(document.querySelectorAll('.govuk-button'))
      const continueButton = buttons.find((b) =>
        b.textContent.includes('Continue')
      )
      expect(continueButton).not.toBeNull()
    })

    test('renders a back link', async () => {
      const { document } = await getPage()
      const backLink = document.querySelector('.govuk-back-link')
      expect(backLink).not.toBeNull()
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

    test('renders hint text with guidance link that opens in new tab', async () => {
      const { document } = await getPage()
      const hintLink = document.querySelector('.govuk-hint a[target="_blank"]')
      expect(hintLink).not.toBeNull()
      expect(hintLink.getAttribute('href')).toContain('gov.uk')
    })
  })

  describe('GET /journey/self-service/nonexistent', () => {
    test('returns 404 for an unknown question route', async () => {
      const { response } = await getPage('/journey/self-service/nonexistent')
      expect(response.statusCode).toBe(statusCodes.notFound)
    })
  })

  describe('POST /journey/self-service/sea', () => {
    test('returns 400 with error summary when no answer is selected', async () => {
      const { response, document } = await postPage(
        '/journey/self-service/sea',
        {}
      )
      expect(response.statusCode).toBe(statusCodes.badRequest)

      const errorSummary = document.querySelector('.govuk-error-summary')
      expect(errorSummary).not.toBeNull()
      expect(errorSummary.textContent).toContain('Select an option')
    })

    test('redirects to the next question when a valid answer is selected', async () => {
      const { response } = await postPage('/journey/self-service/sea', {
        answer: 'inSea'
      })
      expect(response.statusCode).toBe(statusCodes.redirect)
      expect(response.headers.location).toBe(
        '/journey/self-service/jurisdiction'
      )
    })

    test('redirects to /outcome/ URL when answer leads to an outcome', async () => {
      const { response } = await postPage('/journey/self-service/sea', {
        answer: 'other'
      })
      expect(response.statusCode).toBe(statusCodes.redirect)
      expect(response.headers.location).toMatch(
        /^\/journey\/self-service\/outcome\//
      )
    })
  })

  describe('GET /journey/self-service/construction/maintenance-existing-works (multi-select)', () => {
    const url = '/journey/self-service/construction/maintenance-existing-works'

    test('returns 200', async () => {
      const { response } = await getPage(url)
      expect(response.statusCode).toBe(statusCodes.ok)
    })

    test('renders the section caption', async () => {
      const { document } = await getPage(url)
      const caption = document.querySelector('.govuk-caption-l')
      expect(caption.textContent).toContain(
        'Self-service check - Sub-activities'
      )
    })

    test('renders the question heading', async () => {
      const { document } = await getPage(url)
      const legend = document.querySelector('.govuk-fieldset__legend')
      expect(legend.textContent).toContain(
        'Please select sub-activites that match with activities proposed to be carried out.'
      )
    })

    test('renders checkboxes (not radios) for each answer', async () => {
      const { document } = await getPage(url)
      const checkboxes = document.querySelectorAll('input[type="checkbox"]')
      expect(checkboxes.length).toBe(10)
      expect(document.querySelectorAll('input[type="radio"]').length).toBe(0)
    })

    test('renders a Continue button', async () => {
      const { document } = await getPage(url)
      const buttons = Array.from(document.querySelectorAll('.govuk-button'))
      const continueButton = buttons.find((b) =>
        b.textContent.includes('Continue')
      )
      expect(continueButton).not.toBeNull()
    })

    test('renders a back link', async () => {
      const { document } = await getPage(url)
      const backLink = document.querySelector('.govuk-back-link')
      expect(backLink).not.toBeNull()
    })

    test('does not render navigation links in the header', async () => {
      const { document } = await getPage(url)
      expect(
        document.querySelector('.govuk-service-navigation__list')
      ).toBeNull()
    })
  })

  const getSessionCookie = (response) => {
    const setCookieHeader = response.headers['set-cookie']
    const sessionCookie = Array.isArray(setCookieHeader)
      ? setCookieHeader[0]
      : setCookieHeader || ''
    return sessionCookie ? { cookie: sessionCookie } : {}
  }

  describe('navigation flow', () => {
    test('second question page has back link to previous question', async () => {
      const { response: postResponse } = await postPage(
        '/journey/self-service/sea',
        { answer: 'inSea' }
      )

      const headers = getSessionCookie(postResponse)

      const { document } = await getPage(
        '/journey/self-service/jurisdiction',
        headers
      )
      const backLink = document.querySelector('.govuk-back-link')
      expect(backLink.getAttribute('href')).toBe('/journey/self-service/sea')
    })

    test('previous answer is pre-selected when navigating back', async () => {
      const { response: postResponse } = await postPage(
        '/journey/self-service/sea',
        { answer: 'inSea' }
      )

      const headers = getSessionCookie(postResponse)

      const { document } = await getPage('/journey/self-service/sea', headers)
      const checkedRadio = document.querySelector(
        'input[type="radio"][checked]'
      )
      expect(checkedRadio).not.toBeNull()
      expect(checkedRadio.getAttribute('value')).toBe('inSea')
    })

    test('starting a new session clears previous answers', async () => {
      const { response: postResponse } = await postPage(
        '/journey/self-service/sea',
        { answer: 'inSea' }
      )

      const headers = getSessionCookie(postResponse)

      const { response: startResponse } = await postPage(
        '/journey/self-service/start',
        {},
        headers
      )
      const startHeaders = getSessionCookie(startResponse)

      const { document } = await getPage(
        '/journey/self-service/sea',
        startHeaders
      )
      const checkedRadio = document.querySelector(
        'input[type="radio"][checked]'
      )
      expect(checkedRadio).toBeNull()
    })
  })

  describe('POST /journey/self-service/construction/maintenance-existing-works (multi-select)', () => {
    const url = '/journey/self-service/construction/maintenance-existing-works'

    test('returns 400 with error summary when no checkbox is selected', async () => {
      const { response, document } = await postPage(url, {})
      expect(response.statusCode).toBe(statusCodes.badRequest)

      const errorSummary = document.querySelector('.govuk-error-summary')
      expect(errorSummary).not.toBeNull()
      expect(errorSummary.textContent).toContain('Select at least one option')

      const errorLink = errorSummary.querySelector('a')
      expect(errorLink.getAttribute('href')).toBe('#answers')
    })

    test('redirects to the multiSelect.questionRoute when one non-other answer is selected', async () => {
      const { response } = await postPage(url, {
        answers: 'SCAFFOLDING_ACCESS_TOWERS'
      })
      expect(response.statusCode).toBe(statusCodes.redirect)
      expect(response.headers.location).toBe(
        '/journey/self-service/construction/maintenance-existing-works/scaffolding'
      )
    })

    test('redirects to the multiSelect.questionRoute when several non-other answers are selected', async () => {
      const { response } = await postPage(url, {
        answers: ['SCAFFOLDING_ACCESS_TOWERS', 'REPAINTING_STRUCTURES']
      })
      expect(response.statusCode).toBe(statusCodes.redirect)
      expect(response.headers.location).toBe(
        '/journey/self-service/construction/maintenance-existing-works/scaffolding'
      )
    })

    test('redirects to the multiSelect.outcomeRoute when only the other answer is selected', async () => {
      const { response } = await postPage(url, {
        answers: 'OTHER_MAINTENANCE'
      })
      expect(response.statusCode).toBe(statusCodes.redirect)
      expect(response.headers.location).toBe(
        '/journey/self-service/outcome/standard-marine-licence-application/other-maintenance'
      )
    })

    test('redirects to the multiSelect.outcomeRoute when other and non-other are mixed (OTHER_ANY rule)', async () => {
      const { response } = await postPage(url, {
        answers: ['SCAFFOLDING_ACCESS_TOWERS', 'OTHER_MAINTENANCE']
      })
      expect(response.statusCode).toBe(statusCodes.redirect)
      expect(response.headers.location).toBe(
        '/journey/self-service/outcome/standard-marine-licence-application/other-maintenance'
      )
    })
  })

  describe('navigation flow (multi-select)', () => {
    const url = '/journey/self-service/construction/maintenance-existing-works'

    test('next page back link points to the multi-select page after submission', async () => {
      const { response: postResponse } = await postPage(url, {
        answers: 'SCAFFOLDING_ACCESS_TOWERS'
      })

      const headers = getSessionCookie(postResponse)

      const { document } = await getPage(
        '/journey/self-service/construction/maintenance-existing-works/scaffolding',
        headers
      )
      const backLink = document.querySelector('.govuk-back-link')
      expect(backLink.getAttribute('href')).toBe(url)
    })

    test('returning to the multi-select page renders no checked checkboxes (AC5)', async () => {
      const { response: postResponse } = await postPage(url, {
        answers: ['SCAFFOLDING_ACCESS_TOWERS', 'REPAINTING_STRUCTURES']
      })

      const headers = getSessionCookie(postResponse)

      const { document } = await getPage(url, headers)
      const checkedBoxes = document.querySelectorAll(
        'input[type="checkbox"][checked]'
      )
      expect(checkedBoxes.length).toBe(0)
    })
  })
})
