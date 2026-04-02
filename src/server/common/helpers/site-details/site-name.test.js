import { hasInvalidSiteNumber } from './site-name.js'

describe('#site name utils', () => {
  describe('#hasInvalidSiteNumber', () => {
    test('correctly returns with invalid site number in URL params', async () => {
      const isInvalid = hasInvalidSiteNumber(10, [{}, {}])
      expect(isInvalid).toBeTruthy()
    })
    test('correctly returns with valid site number in URL params when editing', async () => {
      const isInvalid = hasInvalidSiteNumber(1, [{}, {}])
      expect(isInvalid).toBeFalsy()
    })
    test('correctly returns with valid site number in URL params when adding', async () => {
      const isInvalid = hasInvalidSiteNumber(3, [{}, {}])
      expect(isInvalid).toBeFalsy()
    })
  })
})
