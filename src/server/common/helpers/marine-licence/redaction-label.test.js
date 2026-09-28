import { wrapRedactionLabels } from '#src/server/common/helpers/marine-licence/redaction-label.js'

const labelHtml = '<span class="app-redaction-label">***REDACTED***</span>'

describe('wrapRedactionLabels', () => {
  test.each([[null], [undefined], ['']])(
    'returns an empty string for %s',
    (text) => {
      expect(wrapRedactionLabels(text)).toBe('')
    }
  )

  test('leaves text without a label untouched', () => {
    expect(wrapRedactionLabels('July 2026 to August 2027')).toBe(
      'July 2026 to August 2027'
    )
  })

  test('wraps every redaction label in a span', () => {
    expect(
      wrapRedactionLabels('From ***REDACTED*** until ***REDACTED***')
    ).toBe(`From ${labelHtml} until ${labelHtml}`)
  })

  test('escapes html in the surrounding text', () => {
    const result = wrapRedactionLabels(
      '<script>alert(1)</script> ***REDACTED***'
    )

    expect(result).not.toContain('<script>')
    expect(result).toContain('&lt;script&gt;')
    expect(result).toContain(labelHtml)
  })
})
