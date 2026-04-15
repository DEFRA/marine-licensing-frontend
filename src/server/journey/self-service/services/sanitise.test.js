import { sanitise, stripHtml } from './sanitise.js'

describe('#sanitise', () => {
  test('adds govuk-hint class to p tags', () => {
    const result = sanitise('<p>Some hint text</p>')
    expect(result).toBe('<p class="govuk-hint">Some hint text</p>')
  })

  test('adds govuk-hint class to unclosed p tags', () => {
    const result = sanitise('<p>Some hint text')
    expect(result).toContain('class="govuk-hint"')
  })

  test('adds govuk-hint class to multiple p tags', () => {
    const result = sanitise('<p>First paragraph<p>Second paragraph')
    expect(result).not.toContain('<p>First')
    expect(result).not.toContain('<p>Second')
    expect(result.match(/govuk-hint/g).length).toBe(2)
  })

  test('preserves allowed inline HTML inside hints', () => {
    const input =
      '<p>Check the <a href="https://example.com" target="_blank">map</a>.</p>'
    const result = sanitise(input)
    expect(result).toContain(
      '<a href="https://example.com" target="_blank">map</a>'
    )
    expect(result).toContain('class="govuk-hint"')
  })

  test('preserves text without p tags unchanged', () => {
    const result = sanitise(
      'Permission or agreement is not the same as formal consent.'
    )
    expect(result).toBe(
      'Permission or agreement is not the same as formal consent.'
    )
  })

  test('preserves lists inside p tags', () => {
    const input = '<p><ul><li>Item one</li><li>Item two</li></ul></p>'
    const result = sanitise(input)
    expect(result).toContain('<ul>')
    expect(result).toContain('<li>Item one</li>')
  })

  test('removes disallowed tags', () => {
    expect(sanitise('<script>alert("xss")</script>')).toBe('')
  })

  test('returns falsy values unchanged', () => {
    expect(sanitise(null)).toBeNull()
    expect(sanitise(undefined)).toBeUndefined()
    expect(sanitise('')).toBe('')
  })
})

describe('#stripHtml', () => {
  test('removes all HTML tags', () => {
    expect(stripHtml('Contains <b>bold</b> and <p>paragraph</p> tags')).toBe(
      'Contains bold and paragraph tags'
    )
  })

  test('removes links but keeps link text', () => {
    expect(stripHtml('See <a href="https://gov.uk">GOV.UK</a>')).toBe(
      'See GOV.UK'
    )
  })

  test('removes malformed list markup', () => {
    expect(stripHtml('Item </li><li>next item</li>')).toBe('Item next item')
  })

  test('returns falsy values unchanged', () => {
    expect(stripHtml(null)).toBeNull()
    expect(stripHtml(undefined)).toBeUndefined()
    expect(stripHtml('')).toBe('')
  })
})
