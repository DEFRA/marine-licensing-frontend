import {
  isDownloadablePdf,
  withAnswersLinkType
} from './is-downloadable-pdf.js'

const MCMS_URL =
  'https://marinelicensing.marinemanagement.org.uk/mmofox5/journey/self-service/outcome-document/23a2a810-5093-4aa0-8fed-6c49f52abff1'
const OUR_URL =
  'https://get-permission-for-marine-work.defra.gov.uk/journey/self-service/outcome-document/BBBBBBBBBBBBBBBBBBBBBB'

describe('isDownloadablePdf', () => {
  it.each([
    MCMS_URL,
    'https://marinelicensingtest.marinemanagement.org.uk/mmofox5uat/journey/self-service/outcome-document/123'
  ])('is true for an MCMS-hosted URL %s', (url) => {
    expect(isDownloadablePdf(url)).toBe(true)
  })

  it.each([
    OUR_URL,
    'https://marine-licensing-frontend.dev.cdp-int.defra.cloud/journey/self-service/outcome-document/123',
    'http://localhost:3000/journey/self-service/outcome-document/123',
    'https://marinemanagement.org.uk/x/journey/self-service/outcome-document/123', // bare host, no subdomain
    'https://evil.example.com/journey/self-service/outcome-document/123',
    'not a url',
    '',
    undefined,
    null
  ])('is false for non-MCMS / malformed / empty input %s', (url) => {
    expect(isDownloadablePdf(url)).toBe(false)
  })
})

describe('withAnswersLinkType', () => {
  it('sets isDownloadablePdf true for an MCMS pdfDownloadUrl', () => {
    const result = withAnswersLinkType({
      pdfDownloadUrl: MCMS_URL,
      articleCode: '17'
    })
    expect(result).toEqual({
      pdfDownloadUrl: MCMS_URL,
      articleCode: '17',
      isDownloadablePdf: true
    })
  })

  it('sets isDownloadablePdf false for our own pdfDownloadUrl', () => {
    const result = withAnswersLinkType({ pdfDownloadUrl: OUR_URL })
    expect(result.isDownloadablePdf).toBe(false)
  })

  it.each([null, undefined])('returns the input unchanged for %s', (input) => {
    expect(withAnswersLinkType(input)).toBe(input)
  })
})
