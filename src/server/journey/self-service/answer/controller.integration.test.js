import { JSDOM } from 'jsdom'
import { vi } from 'vitest'
import { setupTestServer } from '#tests/integration/shared/test-setup-helpers.js'
import { makeGetRequest } from '#src/server/test-helpers/server-requests.js'
import { config } from '#src/config/config.js'

vi.mock('#src/services/iat-answers-service/iat-answers.service.js', () => ({
  iatAnswersService: { get: vi.fn() }
}))

const { iatAnswersService } =
  await import('#src/services/iat-answers-service/iat-answers.service.js')

describe('#answerController (integration)', () => {
  config.set('selfService.enabled', true)
  const getServer = setupTestServer()

  const getPage = async () => {
    const response = await makeGetRequest({
      url: '/journey/self-service/answer/507f1f77bcf86cd799439011',
      server: getServer()
    })
    return {
      response,
      document: new JSDOM(response.result).window.document
    }
  }

  test('renders allowed HTML in summaryText as real elements, not escaped text', async () => {
    vi.mocked(iatAnswersService.get).mockResolvedValueOnce({
      createdAt: new Date('2026-05-01T12:00:00Z'),
      outcome: {
        summaryText: '<p>Hello <a href="https://example.gov.uk/x">link</a></p>'
      },
      answers: [
        {
          questionRoute: '/q1',
          questionText: 'Q1?',
          answers: [{ id: 'a1', text: 'A1' }]
        }
      ]
    })

    const { document } = await getPage()
    const summaryDiv = document.querySelector(
      '.app-iat-answers-page div.govuk-body'
    )
    // Anchor renders as a real <a> element with the right href, not as
    // literal text "<a href=...>".
    const link = summaryDiv.querySelector('a[href="https://example.gov.uk/x"]')
    expect(link).not.toBeNull()
    expect(link.textContent).toBe('link')
    // The container has a <p> child (the wrapping element from summaryText),
    // proving HTML wasn't escaped to text.
    expect(summaryDiv.querySelector('p')).not.toBeNull()
  })

  test('malicious HTML in summaryText renders inert', async () => {
    vi.mocked(iatAnswersService.get).mockResolvedValueOnce({
      createdAt: new Date('2026-05-01T12:00:00Z'),
      outcome: {
        summaryText:
          '<p>ok</p><script>window.__pwned = true</script>' +
          '<a href="javascript:alert(1)">bad</a>'
      },
      answers: [
        {
          questionRoute: '/q1',
          questionText: 'Q1?',
          answers: [{ id: 'a1', text: 'A1' }]
        }
      ]
    })

    const { response, document } = await getPage()
    // The page contains the safe parts.
    expect(document.body.textContent).toContain('ok')
    // No injected <script> survives. The page has a legitimate
    // application.js bootstrap script in bodyEnd, so we cannot assert
    // "no script elements at all" — instead, assert no script whose body
    // contains the injected payload, and assert the raw response doesn't
    // contain the literal opening <script> tag with our payload.
    const injectedScripts = Array.from(
      document.querySelectorAll('script')
    ).filter((s) => s.textContent.includes('window.__pwned'))
    expect(injectedScripts).toHaveLength(0)
    expect(response.result).not.toContain('<script>window.__pwned')
    // The dangerous anchor lost its javascript: href (anchor remains, href is
    // stripped by sanitize-html's scheme allowlist).
    const dangerLinks = Array.from(document.querySelectorAll('a')).filter(
      (a) => a.textContent === 'bad'
    )
    expect(dangerLinks).toHaveLength(1)
    expect(dangerLinks[0].getAttribute('href')).toBeNull()
    // Defence in depth — the raw response body must not contain the literal
    // "javascript:" string in any href attribute that would execute.
    expect(response.result).not.toMatch(/href="javascript:/)
  })
})
