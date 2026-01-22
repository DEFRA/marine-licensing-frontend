import { setExemptionCache } from '#src/server/common/helpers/exemptions/session-cache/utils.js'
import { mockExemption } from '#src/server/test-helpers/mocks/exemption.js'
import { createMockRequest } from '#src/server/test-helpers/mocks/helpers.js'
import { addNewSite, hasInvalidSiteNumber } from './utils'

vi.mock('#src/server/common/helpers/exemptions/session-cache/utils.js')

describe('#site name utils', () => {
  describe('#addNewSite', () => {
    test('adds a new site to payload', async () => {
      const setExemptionCacheMock = vi.mocked(setExemptionCache)

      const request = createMockRequest()
      const mockH = {}
      const payload = { siteName: 'test site' }

      await addNewSite(request, mockH, mockExemption, payload)

      const expected = { ...mockExemption }
      expected.siteDetails = [
        ...expected.siteDetails,
        {
          coordinatesType: 'coordinates',
          siteName: 'test site'
        }
      ]

      expect(setExemptionCacheMock).toHaveBeenCalledWith(
        request,
        mockH,
        expected
      )
    })
  })
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
