import { vi } from 'vitest'

vi.mock('#src/services/iat-answers-service/iat-answers.service.js', () => ({
  iatAnswersService: {
    create: vi.fn()
  }
}))
vi.mock(
  '#src/server/journey/self-service/services/iat-answers-payload.js',
  () => ({
    buildIatAnswersPayload: vi.fn()
  })
)

import { JSDOM } from 'jsdom'
import { statusCodes } from '#src/server/common/constants/status-codes.js'
import { setupTestServer } from '#tests/integration/shared/test-setup-helpers.js'
import {
  makeGetRequest,
  makePostRequest
} from '#src/server/test-helpers/server-requests.js'
import { config } from '#src/config/config.js'
import { iatAnswersService } from '#src/services/iat-answers-service/iat-answers.service.js'
import { buildIatAnswersPayload } from '#src/server/journey/self-service/services/iat-answers-payload.js'

const STUB_ANSWER_ID = 'AZ4rr6bLclCVUsE2Pl_zKw'
const EXPECTED_ANSWER_PAGE_URL = `/journey/self-service/answer/${STUB_ANSWER_ID}`

beforeEach(() => {
  vi.mocked(buildIatAnswersPayload).mockReturnValue({
    outcome: { route: '/stub', typeId: '', summaryText: '' },
    answers: [
      {
        questionRoute: '/stub-question',
        questionText: 'stub',
        answers: [{ id: 'a', text: 'stub' }]
      }
    ]
  })
  vi.mocked(iatAnswersService.create).mockResolvedValue(STUB_ANSWER_ID)
})

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

    test('renders a per-option "View answers" link inside each option card', async () => {
      const { document } = await getPage()
      const cards = document.querySelectorAll('.app-iat-option')
      expect(cards).toHaveLength(3)
      const expectedHrefs = [
        '/journey/self-service/view-answers/WO_CON_EXEMPTION_JOURNEY/construction/journey-select',
        '/journey/self-service/view-answers/WO_CON_SELF_SERVICE_JOURNEY/construction/journey-select',
        '/journey/self-service/view-answers/WO_STANDARD_MLA/construction/journey-select'
      ]
      cards.forEach((card, i) => {
        const link = Array.from(card.querySelectorAll('a.govuk-link')).find(
          (a) => a.textContent.includes('View answers')
        )
        expect(link).not.toBeNull()
        expect(link.getAttribute('href')).toBe(expectedHrefs[i])
        expect(link.getAttribute('target')).toBe('_blank')
        expect(link.getAttribute('rel')).toBe('noopener noreferrer')
        expect(link.textContent.replace(/\s+/g, ' ').trim()).toBe(
          'View answers (opens in a new tab)'
        )
      })
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

describe('GET terminal-single', () => {
  config.set('selfService.enabled', true)
  const getServer = setupTestServer()

  const SINGLE =
    '/journey/self-service/outcome/exemption/licence-not-required-exemption-available-article-25A'

  const getPage = async (path = SINGLE, headers = {}) => {
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

  test('returns 200', async () => {
    const { response } = await getPage(SINGLE)
    expect(response.statusCode).toBe(statusCodes.ok)
  })

  test('renders the H1 from outcome.heading', async () => {
    const { document } = await getPage(SINGLE)
    expect(document.querySelector('h1').textContent).toContain(
      'You need to provide more information'
    )
  })

  test('renders the body with sanitised anchor links', async () => {
    const { document } = await getPage(SINGLE)
    const body = document.querySelector('.govuk-grid-column-full .govuk-body')
    expect(body).not.toBeNull()
    const anchors = body.querySelectorAll('a')
    expect(anchors.length).toBeGreaterThanOrEqual(1)
    for (const a of anchors) {
      expect(a.getAttribute('href')).toMatch(/^https?:\/\//)
    }
  })

  test('does NOT render the outcomeType.heading', async () => {
    const { document } = await getPage(SINGLE)
    expect(document.body.textContent).not.toContain(
      'Fill out an exemption notification'
    )
  })

  test('renders one Continue button (page-level, href="#")', async () => {
    const { document } = await getPage(SINGLE)
    const continueButtons = Array.from(
      document.querySelectorAll('a.govuk-button:not(.govuk-button--secondary)')
    ).filter((a) => a.textContent.trim() === 'Continue')
    expect(continueButtons).toHaveLength(1)
    expect(continueButtons[0].getAttribute('href')).toBe('#')
  })

  test('renders a single "View answers" link with the per-option trigger URL', async () => {
    const { document } = await getPage(SINGLE)
    const links = Array.from(document.querySelectorAll('a.govuk-link')).filter(
      (a) => a.textContent.includes('View answers')
    )
    expect(links).toHaveLength(1)
    const link = links[0]
    expect(link.getAttribute('href')).toBe(
      '/journey/self-service/view-answers/WO_EXE_AVAILABLE_ARTICLE_25A/exemption/licence-not-required-exemption-available-article-25A'
    )
    expect(link.getAttribute('target')).toBe('_blank')
    expect(link.getAttribute('rel')).toBe('noopener noreferrer')
    expect(link.textContent.replace(/\s+/g, ' ').trim()).toBe(
      'View answers (opens in a new tab)'
    )
  })

  test('does not render any option cards', async () => {
    const { document } = await getPage(SINGLE)
    expect(document.querySelectorAll('.app-iat-option')).toHaveLength(0)
  })

  test('renders a back link', async () => {
    const { document } = await getPage(SINGLE)
    expect(document.querySelector('.govuk-back-link')).not.toBeNull()
  })

  test('does not render the phase banner', async () => {
    const { document } = await getPage(SINGLE)
    expect(document.querySelector('.govuk-phase-banner')).toBeNull()
  })

  test('does not render navigation links in the header', async () => {
    const { document } = await getPage(SINGLE)
    expect(document.querySelector('.govuk-service-navigation__list')).toBeNull()
  })
})

describe('GET terminal-multi', () => {
  config.set('selfService.enabled', true)
  const getServer = setupTestServer()

  const MULTI = '/journey/self-service/outcome/scaffolding-impede-navigation'

  const getPage = async (path = MULTI, headers = {}) => {
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

  test('returns 200', async () => {
    const { response } = await getPage(MULTI)
    expect(response.statusCode).toBe(statusCodes.ok)
  })

  test('renders the H1 from outcome.heading', async () => {
    const { document } = await getPage(MULTI)
    expect(document.querySelector('h1').textContent).toContain(
      'Scaffolding or access towers'
    )
  })

  test('renders one option card per outcomeType', async () => {
    const { document } = await getPage(MULTI)
    expect(document.querySelectorAll('.app-iat-option')).toHaveLength(2)
  })

  test('renders "Download" for link: outcomes and "Continue" for module: outcomes', async () => {
    const { document } = await getPage(MULTI)
    const cards = Array.from(document.querySelectorAll('.app-iat-option'))
    const labels = cards.map((c) =>
      c.querySelector('a.govuk-button')?.textContent.trim()
    )
    expect(labels).toEqual(['Download', 'Continue'])
  })

  test('every per-card CTA has href="#"', async () => {
    const { document } = await getPage(MULTI)
    const cards = document.querySelectorAll('.app-iat-option')
    for (const card of cards) {
      const cta = card.querySelector(
        'a.govuk-button:not(.govuk-button--secondary)'
      )
      expect(cta).not.toBeNull()
      expect(cta.getAttribute('href')).toBe('#')
    }
  })

  test('renders a per-option "View answers" link inside each option card', async () => {
    const { document } = await getPage(MULTI)
    const cards = document.querySelectorAll('.app-iat-option')
    expect(cards).toHaveLength(2)
    const expectedHrefs = [
      '/journey/self-service/view-answers/WO_DOWNLOAD_HA_AGREED_METHOD_TEMPLATE/scaffolding-impede-navigation',
      '/journey/self-service/view-answers/WO_STANDARD_TRACK_MLA/scaffolding-impede-navigation'
    ]
    cards.forEach((card, i) => {
      const link = Array.from(card.querySelectorAll('a.govuk-link')).find((a) =>
        a.textContent.includes('View answers')
      )
      expect(link).not.toBeNull()
      expect(link.getAttribute('href')).toBe(expectedHrefs[i])
      expect(link.getAttribute('target')).toBe('_blank')
      expect(link.getAttribute('rel')).toBe('noopener noreferrer')
    })
  })

  test('renders a back link', async () => {
    const { document } = await getPage(MULTI)
    expect(document.querySelector('.govuk-back-link')).not.toBeNull()
  })

  test('omits the trailing dash on a card whose outcomeType has no heading', async () => {
    const MOD = '/journey/self-service/outcome/mod-permission'
    const { document } = await getPage(MOD)
    const cards = Array.from(document.querySelectorAll('.app-iat-option h2'))
    const headings = cards.map((h) => h.textContent.trim())
    expect(headings[0]).toBe('Option 1')
    expect(headings[1]).toBe('Option 2 - Apply for a standard marine licence')
  })
})

describe('GET licence-not-required (terminal-single, info-only)', () => {
  config.set('selfService.enabled', true)
  const getServer = setupTestServer()

  const ROUTE = '/journey/self-service/outcome/licence-not-required-devolved'

  const getPage = async (path = ROUTE) => {
    const response = await makeGetRequest({ url: path, server: getServer() })
    return {
      response,
      document: new JSDOM(response.result).window.document
    }
  }

  test('returns 200', async () => {
    const { response } = await getPage()
    expect(response.statusCode).toBe(statusCodes.ok)
  })

  test('renders the H1 from outcome.heading', async () => {
    const { document } = await getPage()
    expect(document.querySelector('h1').textContent).toContain(
      'Marine licence not required'
    )
  })

  test('renders the body from the outcomeType text', async () => {
    const { document } = await getPage()
    const body = document.querySelector('.govuk-grid-column-full .govuk-body')
    expect(body).not.toBeNull()
    expect(body.textContent).toContain('relevant devolved administration')
  })

  test('renders the "View answers" link with the per-option trigger URL', async () => {
    const { document } = await getPage()
    const links = Array.from(document.querySelectorAll('a.govuk-link')).filter(
      (a) => a.textContent.includes('View answers')
    )
    expect(links).toHaveLength(1)
    const link = links[0]
    expect(link.getAttribute('href')).toBe(
      '/journey/self-service/view-answers/WO_EXE_LICENCE_DEVOLVED/licence-not-required-devolved'
    )
    expect(link.getAttribute('target')).toBe('_blank')
    expect(link.getAttribute('rel')).toBe('noopener noreferrer')
  })

  test('does NOT render a primary Continue button', async () => {
    const { document } = await getPage()
    const buttons = Array.from(document.querySelectorAll('a.govuk-button'))
    const primaryCount = buttons.filter(
      (a) => !a.classList.contains('govuk-button--secondary')
    ).length
    expect(primaryCount).toBe(0)
  })

  test('renders a back link', async () => {
    const { document } = await getPage()
    expect(document.querySelector('.govuk-back-link')).not.toBeNull()
  })
})

describe('POST to a terminal outcome route', () => {
  config.set('selfService.enabled', true)
  const getServer = setupTestServer()

  test('returns 404 (terminal pages have no POST handler behaviour)', async () => {
    const response = await makePostRequest({
      url: '/journey/self-service/outcome/scaffolding-impede-navigation',
      server: getServer(),
      formData: { outcomeType: 'WO_STANDARD_TRACK_MLA' }
    })
    expect(response.statusCode).toBe(statusCodes.notFound)
  })
})

describe('GET /journey/self-service/view-answers/:outcomeTypeId/:outcomePath', () => {
  config.set('selfService.enabled', true)
  const getServer = setupTestServer()

  const TRIGGER_URL =
    '/journey/self-service/view-answers/WO_DOWNLOAD_HA_MARKERS_AGREED_METHOD_TEMPLATE/markers/ha-not-agreed'

  test('redirects to the slugged answer page returned by iatAnswersService.create', async () => {
    const response = await makeGetRequest({
      url: TRIGGER_URL,
      server: getServer()
    })
    expect(response.statusCode).toBe(statusCodes.redirect)
    expect(response.headers.location).toBe(EXPECTED_ANSWER_PAGE_URL)
    expect(buildIatAnswersPayload).toHaveBeenCalledWith(
      expect.anything(),
      '/markers/ha-not-agreed',
      'WO_DOWNLOAD_HA_MARKERS_AGREED_METHOD_TEMPLATE'
    )
    expect(iatAnswersService.create).toHaveBeenCalledTimes(1)
  })

  test('returns 400 when the outcomeTypeId is not in the outcome', async () => {
    const response = await makeGetRequest({
      url: '/journey/self-service/view-answers/WO_UNRELATED_TYPE/markers/ha-not-agreed',
      server: getServer()
    })
    expect(response.statusCode).toBe(statusCodes.badRequest)
    expect(iatAnswersService.create).not.toHaveBeenCalled()
  })

  test('returns 404 when the outcome route is unknown', async () => {
    const response = await makeGetRequest({
      url: '/journey/self-service/view-answers/WO_DOWNLOAD_HA_MARKERS_AGREED_METHOD_TEMPLATE/nonexistent-outcome',
      server: getServer()
    })
    expect(response.statusCode).toBe(statusCodes.notFound)
    expect(iatAnswersService.create).not.toHaveBeenCalled()
  })
})
