import { sanitiseFilename } from '#src/config/nunjucks/filters/sanitise-filename.js'

describe('#sanitiseFilename', () => {
  describe('With normal filenames', () => {
    test('Should return short filename unchanged', () => {
      expect(sanitiseFilename('document.pdf')).toBe('document.pdf')
    })

    test('Should return filename with spaces unchanged when under limit', () => {
      expect(sanitiseFilename('my document file.pdf')).toBe(
        'my document file.pdf'
      )
    })
  })

  describe('With long filenames', () => {
    test('Should truncate long filename and add ellipsis', () => {
      const longFilename =
        'this-is-a-very-very-very-long-filename-that-exceeds-the-limit.pdf'
      const result = sanitiseFilename(longFilename)
      expect(result).toBe(
        'this-is-a-very-very-very-long-filename-that-exceeds-the-limit...'
      )
      expect(result).toHaveLength(64)
    })

    test('Should break at word boundary when possible', () => {
      const filename =
        'my very very very long document file name write a short letter to grandma that is too big.pdf'
      const result = sanitiseFilename(filename)
      expect(result).toMatch(/\.\.\.$/)
      expect(result.length).toBeLessThanOrEqual(64)
      expect(result).not.toMatch(/\s\.\.\.$/) // Should not end with space before ellipsis
    })
  })

  describe('With dangerous characters', () => {
    test('Should remove HTML/XML dangerous characters', () => {
      expect(sanitiseFilename('file<script>alert("xss")</script>.pdf')).toBe(
        'filescriptalert(xss)script.pdf'
      )
    })

    test('Should remove path traversal characters', () => {
      expect(sanitiseFilename('../../../etc/passwd')).toBe('......etcpasswd')
    })

    test('Should remove control characters', () => {
      expect(sanitiseFilename('file\x00\x01\x1f.pdf')).toBe('file.pdf')
    })

    test('Should remove filesystem dangerous characters', () => {
      expect(sanitiseFilename('file:name|with*dangerous?chars.pdf')).toBe(
        'filenamewithdangerouschars.pdf'
      )
    })
  })

  describe('With whitespace issues', () => {
    test('Should normalise multiple spaces', () => {
      expect(sanitiseFilename('file    with    spaces.pdf')).toBe(
        'file with spaces.pdf'
      )
    })

    test('Should trim leading and trailing spaces', () => {
      expect(sanitiseFilename('  spaced file.pdf  ')).toBe('spaced file.pdf')
    })
  })

  describe('With edge cases', () => {
    test('Should handle null input', () => {
      expect(sanitiseFilename(null)).toBe('')
    })

    test('Should handle undefined input', () => {
      expect(sanitiseFilename(undefined)).toBe('')
    })

    test('Should handle empty string', () => {
      expect(sanitiseFilename('')).toBe('')
    })

    test('Should handle non-string input', () => {
      expect(sanitiseFilename(123)).toBe('')
    })

    test('Should handle string of only dangerous characters', () => {
      expect(sanitiseFilename('<>:"/\\|?*')).toBe('')
    })
  })

  describe('With custom maxLength', () => {
    test('Should respect custom maxLength parameter', () => {
      const filename = 'this is a long filename'
      const result = sanitiseFilename(filename, 10)
      expect(result).toBe('this...')
      expect(result).toHaveLength(7)
    })

    test('Should not truncate when filename is shorter than custom maxLength', () => {
      const filename = 'short.pdf'
      const result = sanitiseFilename(filename, 50)
      expect(result).toBe('short.pdf')
    })
  })

  describe('Word boundary handling', () => {
    test('Should break at word boundary when space is near end', () => {
      // Create a filename where breaking at word boundary makes sense
      const filename = 'document name that is quite long indeed.pdf'
      const result = sanitiseFilename(filename, 25)
      expect(result).toMatch(/^document name that is...$/)
    })

    test('Should hard truncate when no good word boundary exists', () => {
      const filename = 'verylongfilenamewithnospacesorwordbreaks.pdf'
      const result = sanitiseFilename(filename, 20)
      expect(result).toBe('verylongfilenamew...')
      expect(result).toHaveLength(20)
    })
  })
})
