import { describe, expect, test } from 'vitest'
import nunjucks from 'nunjucks'
import { sanitiseRichTextFilter } from './sanitise-rich-text.js'

describe('sanitiseRichTextFilter', () => {
  test('returns empty string for null/undefined/empty input', () => {
    expect(sanitiseRichTextFilter(null)).toBe('')
    expect(sanitiseRichTextFilter(undefined)).toBe('')
    expect(sanitiseRichTextFilter('')).toBe('')
  })

  test('returns a SafeString instance for non-empty input', () => {
    // Load-bearing: this proves we did not regress to a plain string and
    // accidentally lose the autoescape bypass. A plain string would be
    // re-escaped by Nunjucks at render time, defeating the filter.
    const result = sanitiseRichTextFilter('<p>hello</p>')
    expect(result).toBeInstanceOf(nunjucks.runtime.SafeString)
  })

  test('SafeString toString equals sanitised output', () => {
    const result = sanitiseRichTextFilter('<p>ok</p><script>alert(1)</script>')
    expect(result.toString()).toBe('<p>ok</p>')
  })

  test('strips javascript: scheme from anchor href', () => {
    const result = sanitiseRichTextFilter('<a href="javascript:alert(1)">x</a>')
    expect(result.toString()).toBe('<a>x</a>')
  })
})
