import { vi } from 'vitest'
import { FilenameHandler } from './filename-handler.js'
import rfc2047 from 'rfc2047'

describe('FilenameHandler', () => {
  let filenameHandler // sut
  let mockLogger

  beforeEach(() => {
    mockLogger = {
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn()
    }

    filenameHandler = new FilenameHandler(mockLogger)
  })

  describe('constructor', () => {
    it('should initialize with provided logger', () => {
      expect(filenameHandler.logger).toBe(mockLogger)
    })
  })

  describe('extractFilename', () => {
    it('should return regular filename when available', () => {
      const fileData = { filename: 'test.txt' }
      expect(filenameHandler.extractFilename(fileData)).toBe('test.txt')
    })

    it('should decode and return RFC-2047 encoded filename when regular filename not available', () => {
      const encodedFilename = '=?UTF-8?Q?test=C3=A4.txt?='
      const decodedFilename = 'testä.txt'

      const fileData = { encodedfilename: encodedFilename }
      expect(filenameHandler.extractFilename(fileData)).toBe(decodedFilename)
    })

    it('should return fallback when neither filename nor encodedfilename available', () => {
      const fileData = {}
      expect(filenameHandler.extractFilename(fileData)).toBe('unknown-file')
    })

    it('should handle null/undefined file data gracefully', () => {
      expect(filenameHandler.extractFilename(null)).toBe('unknown-file')
      expect(filenameHandler.extractFilename(undefined)).toBe('unknown-file')
    })
  })

  describe('decodeRfc2047Filename', () => {
    const invalidEncodedFilename = '=?invalid-encoding?='

    it('should successfully decode RFC-2047 encoded filename', () => {
      const encodedFilename = '=?UTF-8?Q?test=C3=A4.txt?='
      const decodedFilename = 'testä.txt'

      expect(filenameHandler.decodeRfc2047Filename(encodedFilename)).toBe(
        decodedFilename
      )
    })

    it('should handle decoding errors gracefully', () => {
      expect(
        filenameHandler.decodeRfc2047Filename(invalidEncodedFilename)
      ).toBe(
        invalidEncodedFilename // does not decode
      )
    })

    it('handles an error thrown', () => {
      vi.spyOn(rfc2047, 'decode').mockImplementation(() => {
        throw new Error('invalid encoding')
      })
      const fname = filenameHandler.decodeRfc2047Filename(
        invalidEncodedFilename
      )
      expect(mockLogger.warn).toHaveBeenCalled()
      expect(fname).toBe(invalidEncodedFilename)
    })
  })

  describe('hasFilenameData', () => {
    it('should return true when filename is present', () => {
      expect(filenameHandler.hasFilenameData({ filename: 'test.txt' })).toBe(
        true
      )
    })

    it('should return true when encodedfilename is present', () => {
      expect(
        filenameHandler.hasFilenameData({
          encodedfilename: '=?UTF-8?Q?test.txt?='
        })
      ).toBe(true)
    })

    it('should return false when neither filename nor encodedfilename is present', () => {
      expect(filenameHandler.hasFilenameData({})).toBe(false)
    })

    it('should handle null/undefined input gracefully', () => {
      expect(filenameHandler.hasFilenameData(null)).toBe(false)
      expect(filenameHandler.hasFilenameData(undefined)).toBe(false)
    })
  })
})
