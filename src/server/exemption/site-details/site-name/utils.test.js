import { setExemptionCache } from '#src/server/common/helpers/session-cache/utils.js'
import {
  createMockRequest,
  mockExemption
} from '#src/server/test-helpers/mocks.js'
import { addNewSite } from './utils'

vi.mock('#src/server/common/helpers/session-cache/utils.js')

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
})
