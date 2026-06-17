import { isMcmsHost } from './is-mcms-host.js'

describe('isMcmsHost', () => {
  it.each([
    'marinelicensing.marinemanagement.org.uk',
    'marinelicensingtest.marinemanagement.org.uk'
  ])('returns true for the MCMS host %s', (host) => {
    expect(isMcmsHost(host)).toBe(true)
  })

  it.each([
    'marinemanagement.org.uk', // no subdomain
    'get-permission-for-marine-work.defra.gov.uk',
    'localhost:3000',
    'evil.example.com',
    'marinemanagement.org.uk.evil.com',
    ''
  ])('returns false for non-MCMS host %s', (host) => {
    expect(isMcmsHost(host)).toBe(false)
  })
})
