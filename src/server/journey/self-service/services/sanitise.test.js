import { sanitise, stripHtml } from './sanitise.js'

describe('#sanitise', () => {
  test('allows safe HTML tags', () => {
    const input =
      '<p>Text with <a href="https://gov.uk" target="_blank">link</a></p>'
    expect(sanitise(input)).toBe(input)
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
