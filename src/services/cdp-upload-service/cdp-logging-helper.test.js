import { CdpLoggingHelper } from './cdp-logging-helper.js'

describe('CdpLoggingHelper', () => {
  let logger
  let helper

  beforeEach(() => {
    logger = { debug: jest.fn() }
    helper = new CdpLoggingHelper(logger)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('logFileDataExtraction', () => {
    it('should handle null fileData', () => {
      const formData = { someKey: 'value' }
      helper.logFileDataExtraction(null, formData)

      const calls = logger.debug.mock.calls.map((call) => call[0])
      expect(calls).toContain('File data extraction result')
      expect(calls).toContain('File Data Exists: false')
      expect(calls).toContain('Extracted File Data: null')
      expect(calls).toContain(
        `First Form Value: ${JSON.stringify('value', null, 2)}`
      )
    })

    it('should handle empty form object', () => {
      const fileData = { someData: true }
      helper.logFileDataExtraction(fileData, {})

      const calls = logger.debug.mock.calls.map((call) => call[0])
      expect(calls).toContain('File data extraction result')
      expect(calls).toContain('File Data Exists: true')
      expect(calls).toContain(
        `Extracted File Data: ${JSON.stringify(fileData, null, 2)}`
      )
      expect(calls).toContain('First Form Value: no form values')
    })

    it('should handle null form', () => {
      const fileData = { someData: true }
      helper.logFileDataExtraction(fileData, null)

      const calls = logger.debug.mock.calls.map((call) => call[0])
      expect(calls).toContain('File data extraction result')
      expect(calls).toContain('File Data Exists: true')
      expect(calls).toContain(
        `Extracted File Data: ${JSON.stringify(fileData, null, 2)}`
      )
      expect(calls).toContain('First Form Value: no form values')
    })
  })
})
