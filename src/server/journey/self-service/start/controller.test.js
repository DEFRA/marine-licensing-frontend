import { vi } from 'vitest'
import { JSDOM } from 'jsdom'
import { iatStartController } from '#src/server/journey/self-service/start/controller.js'
import { statusCodes } from '#src/server/common/constants/status-codes.js'
import { setupTestServer } from '#tests/integration/shared/test-setup-helpers.js'
import { makeGetRequest } from '#src/server/test-helpers/server-requests.js'

describe('#iatStartController', () => {
  test('Should call h.view with expected template path and view model', () => {
    const h = { view: vi.fn() }

    iatStartController.handler({}, h)

    expect(h.view).toHaveBeenCalledTimes(1)
    expect(h.view).toHaveBeenCalledWith(
      'journey/self-service/start/index',
      {
        pageTitle: 'Check if you need a marine licence',
        hidePhaseBanner: true,
        links: {
          jurisdiction:
            'https://www.gov.uk/guidance/marine-licensing-definitions#jurisdiction',
          exemptions:
            'https://www.gov.uk/guidance/do-i-need-a-marine-licence#exemptions',
          selfService:
            'https://www.gov.uk/guidance/do-i-need-a-marine-licence#self-service',
          guidance: 'https://www.gov.uk/guidance/do-i-need-a-marine-licence'
        }
      }
    )
  })
})

describe('#iatStartController (integration)', () => {
  const getServer = setupTestServer()

  const getPage = async () => {
    const response = await makeGetRequest({
      url: '/journey/self-service/start',
      server: getServer()
    })
    return {
      response,
      document: new JSDOM(response.result).window.document
    }
  }

  test('Returns 200 for the request', async () => {
    const { response } = await getPage()
    expect(response.statusCode).toBe(statusCodes.ok)
  })

  test('Renders the expected H1', async () => {
    const { document } = await getPage()
    expect(document.querySelector('h1').textContent).toContain(
      'Check if you need a marine licence'
    )
  })

  test('Renders all four external links with the expected hrefs', async () => {
    const { document } = await getPage()
    const hrefs = Array.from(document.querySelectorAll('a[href]')).map(
      (a) => a.getAttribute('href')
    )
    expect(hrefs).toContain(
      'https://www.gov.uk/guidance/marine-licensing-definitions#jurisdiction'
    )
    expect(hrefs).toContain(
      'https://www.gov.uk/guidance/do-i-need-a-marine-licence#exemptions'
    )
    expect(hrefs).toContain(
      'https://www.gov.uk/guidance/do-i-need-a-marine-licence#self-service'
    )
    expect(hrefs).toContain(
      'https://www.gov.uk/guidance/do-i-need-a-marine-licence'
    )
  })

  test('All four external gov.uk links open in a new tab with rel=noopener', async () => {
    const { document } = await getPage()
    const externalLinks = Array.from(
      document.querySelectorAll('.govuk-grid-column-two-thirds a[href^="https://www.gov.uk"]')
    )
    expect(externalLinks.length).toBeGreaterThanOrEqual(4)
    for (const link of externalLinks) {
      expect(link.getAttribute('target')).toBe('_blank')
      expect(link.getAttribute('rel')).toContain('noopener')
    }
  })

  test('Renders a browser-history back link', async () => {
    const { document } = await getPage()
    expect(document.querySelector('.govuk-back-link')).not.toBeNull()
  })

  test('Renders a non-functional "Start now" button', async () => {
    const { document } = await getPage()
    const startButton = document.querySelector('.govuk-button--start')
    expect(startButton).not.toBeNull()
    expect(startButton.textContent).toContain('Start now')
    expect(startButton.getAttribute('href')).toBe('#')
  })

  test('Does not render the phase banner', async () => {
    const { document } = await getPage()
    expect(document.querySelector('.govuk-phase-banner')).toBeNull()
  })
})
