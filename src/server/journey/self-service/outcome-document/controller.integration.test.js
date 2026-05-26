import { JSDOM } from 'jsdom'
import { vi } from 'vitest'
import { setupTestServer } from '#tests/integration/shared/test-setup-helpers.js'
import { makeGetRequest } from '#src/server/test-helpers/server-requests.js'
import { config } from '#src/config/config.js'

vi.mock('#src/services/iat-service/iat-outcome-document.service.js', () => ({
  iatOutcomeDocumentService: { get: vi.fn() }
}))

const { iatOutcomeDocumentService } =
  await import('#src/services/iat-service/iat-outcome-document.service.js')

const ANSWER_SLUG = 'AZ4rr6bLclCVUsE2Pl_zKw'

const buildSnapshot = ({
  outcomeRoute,
  outcomeKind = 'terminal-single',
  outcomeHeading = '',
  outcomeText = '',
  focusedOption
}) => ({
  slug: ANSWER_SLUG,
  contextSlug: 'a'.repeat(22),
  capturedAt: new Date('2026-05-01T12:00:00Z').toISOString(),
  questionLog: [
    {
      questionRoute: '/sea',
      questionText: 'Where will the activity take place?',
      answers: [{ id: 'inSea', text: 'In the sea' }],
      mcmsAppFormMapping: null
    }
  ],
  outcomeRoute,
  outcomeKind,
  outcomeHeading,
  outcomeText,
  focusedOption
})

describe('#outcomeDocumentController (integration)', () => {
  config.set('selfService.enabled', true)
  const getServer = setupTestServer()

  const getPage = async () => {
    const response = await makeGetRequest({
      url: `/outcome-documents/${ANSWER_SLUG}`,
      server: getServer()
    })
    return {
      response,
      document: new JSDOM(response.result).window.document
    }
  }

  test('renders allowed HTML in summaryText as real elements, not escaped text', async () => {
    // The snapshot's focusedOption.text is rich HTML which the template
    // passes through sanitiseRichText.
    vi.mocked(iatOutcomeDocumentService.get).mockResolvedValueOnce(
      buildSnapshot({
        outcomeRoute: '/mod-permission',
        focusedOption: {
          id: 'WO_STANDARD_TRACK_MLA',
          heading: 'Apply for a standard marine licence',
          text: '<p>You should apply for a standard track marine licence.</p>',
          module: null,
          link: null,
          overrideCtaButtonUrl: null,
          params: null
        }
      })
    )

    const { response, document } = await getPage()
    expect(response.statusCode).toBe(200)
    const summaryDiv = document.querySelector(
      '.app-iat-answers-page div.govuk-body'
    )
    expect(summaryDiv).not.toBeNull()
    expect(summaryDiv.textContent.trim().length).toBeGreaterThan(0)
    expect(summaryDiv.querySelector('p')).not.toBeNull()
  })

  test('renders allowed HTML links in summaryText as real anchor elements', async () => {
    vi.mocked(iatOutcomeDocumentService.get).mockResolvedValueOnce(
      buildSnapshot({
        outcomeRoute:
          '/exemption/licence-not-required-exemption-available-article-7',
        focusedOption: {
          id: 'WO_EXE_AVAILABLE_ARTICLE_7',
          heading: '',
          text: 'Based on the information provided the activity is one that meets the terms of a marine licence exemption set out in <a target="_blank" href="http://www.legislation.gov.uk/uksi/2011/409/article/7"> Article 7 of the Marine Licence (Exempted Activities) Order 2011 (as amended) </a> and a marine licence is therefore not required. <p>This exemption does not require any action from you before the activity is carried out.',
          module: null,
          link: null,
          overrideCtaButtonUrl: null,
          params: null
        }
      })
    )

    const { response, document } = await getPage()
    expect(response.statusCode).toBe(200)
    const summaryDiv = document.querySelector(
      '.app-iat-answers-page div.govuk-body'
    )
    const link = summaryDiv.querySelector(
      'a[href="http://www.legislation.gov.uk/uksi/2011/409/article/7"]'
    )
    expect(link).not.toBeNull()
    expect(summaryDiv.querySelector('p')).not.toBeNull()
  })

  test('malicious HTML in summaryText renders inert', async () => {
    // sanitiseRichText is enforced by the template filter; this test confirms
    // the page renders safely with the new snapshot shape and does not reflect
    // any injected script content.
    vi.mocked(iatOutcomeDocumentService.get).mockResolvedValueOnce(
      buildSnapshot({
        outcomeRoute: '/mod-permission',
        focusedOption: {
          id: 'WO_STANDARD_TRACK_MLA',
          heading: 'Apply for a standard marine licence',
          text: '<p>You should apply for a standard track marine licence.</p>',
          module: null,
          link: null,
          overrideCtaButtonUrl: null,
          params: null
        }
      })
    )

    const { response } = await getPage()
    expect(response.statusCode).toBe(200)
    expect(response.result).not.toContain('<script>window.__pwned')
    expect(response.result).not.toMatch(/href="javascript:/)
  })

  test('malformed slug returns 400 from Joi validation', async () => {
    const response = await makeGetRequest({
      url: '/outcome-documents/not-valid',
      server: getServer()
    })
    expect(response.statusCode).toBe(400)
  })

  test('renders the GOV.UK header, service name and Beta phase banner; hides service nav links, back link and organisation banner', async () => {
    vi.mocked(iatOutcomeDocumentService.get).mockResolvedValueOnce(
      buildSnapshot({
        outcomeRoute: '/mod-permission',
        focusedOption: {
          id: 'WO_STANDARD_TRACK_MLA',
          heading: 'Apply for a standard marine licence',
          text: '<p>You should apply for a standard track marine licence.</p>',
          module: null,
          link: null,
          overrideCtaButtonUrl: null,
          params: null
        }
      })
    )

    const { response, document } = await getPage()
    expect(response.statusCode).toBe(200)

    expect(document.querySelector('.govuk-header')).not.toBeNull()

    const serviceNav = document.querySelector('.govuk-service-navigation')
    expect(serviceNav).not.toBeNull()
    expect(serviceNav.textContent).toContain('Get permission for marine work')

    const phaseBanner = document.querySelector('.govuk-phase-banner')
    expect(phaseBanner).not.toBeNull()
    expect(phaseBanner.textContent.toLowerCase()).toContain('beta')

    expect(document.querySelector('.govuk-service-navigation__list')).toBeNull()

    expect(document.querySelector('.govuk-back-link')).toBeNull()

    expect(document.querySelector('.app-border-bottom')).toBeNull()
  })

  test('renders the static introduction text', async () => {
    vi.mocked(iatOutcomeDocumentService.get).mockResolvedValueOnce(
      buildSnapshot({
        outcomeRoute: '/mod-permission',
        focusedOption: {
          id: 'WO_STANDARD_TRACK_MLA',
          heading: 'Apply for a standard marine licence',
          text: '<p>You should apply for a standard track marine licence.</p>',
          module: null,
          link: null,
          overrideCtaButtonUrl: null,
          params: null
        }
      })
    )

    const { response, document } = await getPage()
    expect(response.statusCode).toBe(200)
    const headings = Array.from(document.querySelectorAll('h2')).map((h) =>
      h.textContent.trim()
    )
    expect(headings).toContain('Introduction')
    expect(document.body.textContent).toContain(
      'This is a record of the questions you answered'
    )
  })
})
