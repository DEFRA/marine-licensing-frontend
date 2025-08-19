import { getMultipleSitesEnabledValue } from './utils.js'

describe('#getMultipleSitesEnabledValue', () => {
  test('should return undefined when multipleSiteDetails is undefined', () => {
    const result = getMultipleSitesEnabledValue(undefined)
    expect(result).toBeUndefined()
  })

  test('should return undefined when multipleSiteDetails is null', () => {
    const result = getMultipleSitesEnabledValue(null)
    expect(result).toBeUndefined()
  })

  test('should return undefined when multipleSiteDetails.multipleSitesEnabled is undefined', () => {
    const result = getMultipleSitesEnabledValue({})
    expect(result).toBeUndefined()
  })

  test('should return "yes" when multipleSiteDetails.multipleSitesEnabled is true', () => {
    const result = getMultipleSitesEnabledValue({ multipleSitesEnabled: true })
    expect(result).toBe('yes')
  })

  test('should return "no" when multipleSiteDetails.multipleSitesEnabled is false', () => {
    const result = getMultipleSitesEnabledValue({ multipleSitesEnabled: false })
    expect(result).toBe('no')
  })
})
