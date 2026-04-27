import { sanitise, sanitiseRichText, stripHtml } from './sanitise.js'

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

describe('#sanitiseRichText', () => {
  test('preserves allowed inline tags', () => {
    const input =
      '<p><b>Bold</b> with <strong>strong</strong> and <u>underline</u>.</p>'
    const result = sanitiseRichText(input)
    expect(result).toContain('<b>Bold</b>')
    expect(result).toContain('<strong>strong</strong>')
    expect(result).toContain('<u>underline</u>')
    expect(result).toContain('<p>')
  })

  test('does not rewrite <p> to govuk-hint class', () => {
    const result = sanitiseRichText('<p>Body paragraph</p>')
    expect(result).toBe('<p>Body paragraph</p>')
    expect(result).not.toContain('govuk-hint')
  })

  test('preserves lists', () => {
    const result = sanitiseRichText('<ul><li>One</li><li>Two</li></ul>')
    expect(result).toContain('<ul>')
    expect(result).toContain('<li>One</li>')
    expect(result).toContain('<li>Two</li>')
  })

  test('preserves <br/> tags', () => {
    const result = sanitiseRichText('Line one<br/>Line two')
    expect(result).toContain('<br')
    expect(result).toContain('Line one')
    expect(result).toContain('Line two')
  })

  test('preserves anchors with href, target and rel', () => {
    const input =
      '<a href="https://www.gov.uk/" target="_blank" rel="noopener">gov.uk</a>'
    const result = sanitiseRichText(input)
    expect(result).toContain('href="https://www.gov.uk/"')
    expect(result).toContain('target="_blank"')
    expect(result).toContain('rel="noopener"')
  })

  test('preserves http and https schemes', () => {
    expect(
      sanitiseRichText('<a href="http://legislation.gov.uk/">law</a>')
    ).toContain('href="http://legislation.gov.uk/"')
    expect(sanitiseRichText('<a href="https://gov.uk/">gov</a>')).toContain(
      'href="https://gov.uk/"'
    )
  })

  test('strips javascript: hrefs', () => {
    const result = sanitiseRichText('<a href="javascript:alert(1)">x</a>')
    expect(result).not.toContain('javascript:')
  })

  test('strips <script> and on* handlers', () => {
    expect(sanitiseRichText('<script>alert("xss")</script>')).toBe('')
    const result = sanitiseRichText(
      '<a href="https://x/" onclick="alert(1)">link</a>'
    )
    expect(result).not.toContain('onclick')
  })

  test('auto-balances malformed nested tags in source data', () => {
    const result = sanitiseRichText('<b><b>Please select.</b></b>')
    expect(result).toContain('Please select.')
    expect((result.match(/<b>/g) || []).length).toBeGreaterThan(0)
  })

  test('returns falsy values unchanged', () => {
    expect(sanitiseRichText(null)).toBeNull()
    expect(sanitiseRichText(undefined)).toBeUndefined()
    expect(sanitiseRichText('')).toBe('')
  })
})

describe('#sanitise (regression)', () => {
  test('still rewrites <p> to govuk-hint class', () => {
    expect(sanitise('<p>hint</p>')).toBe('<p class="govuk-hint">hint</p>')
  })
})
