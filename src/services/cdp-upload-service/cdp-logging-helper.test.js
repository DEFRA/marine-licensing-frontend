import { vi } from 'vitest'
import { CdpLoggingHelper } from './cdp-logging-helper.js'

describe('CdpLoggingHelper', () => {
  let logger
  let helper

  beforeEach(() => {
    logger = {
      debug: vi.fn(),
      info: vi.fn()
    }
    helper = new CdpLoggingHelper(logger)
  })

  describe('logFileDataExtraction', () => {
    it('should handle null fileData', () => {
      const formData = { someKey: 'value' }
      helper.logFileDataExtraction(null, formData)

      const calls = logger.debug.mock.calls.map((call) => call[0])
      expect(calls).toContain('FileUpload: File data extraction result')
      expect(calls).toContain('FileUpload: File Data Exists: false')
      expect(calls).toContain('FileUpload: First Form Value: "value"')

      const infoCalls = logger.info.mock.calls.map((call) => call[0])
      expect(infoCalls).toContain('FileUpload: Extracted File Data: null')
    })

    it('should handle empty form object', () => {
      const fileData = { someData: true }
      helper.logFileDataExtraction(fileData, {})

      const calls = logger.debug.mock.calls.map((call) => call[0])
      expect(calls).toContain('FileUpload: File data extraction result')
      expect(calls).toContain('FileUpload: File Data Exists: true')
      expect(calls).toContain('FileUpload: First Form Value: no form values')
      const infoCalls = logger.info.mock.calls.map((call) => call[0])
      expect(infoCalls).toContain(
        `FileUpload: Extracted File Data: ${JSON.stringify(fileData, null, 2)}`
      )
    })

    it('should handle null form', () => {
      const fileData = { someData: true }
      helper.logFileDataExtraction(fileData, null)

      const calls = logger.debug.mock.calls.map((call) => call[0])
      expect(calls).toContain('FileUpload: File data extraction result')
      expect(calls).toContain('FileUpload: File Data Exists: true')
      expect(calls).toContain('FileUpload: First Form Value: no form values')
      const infoCalls = logger.info.mock.calls.map((call) => call[0])
      expect(infoCalls).toContain(
        `FileUpload: Extracted File Data: ${JSON.stringify(fileData, null, 2)}`
      )
    })
  })
})
