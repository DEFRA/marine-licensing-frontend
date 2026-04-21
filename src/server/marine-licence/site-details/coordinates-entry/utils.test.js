import { getBackRoute } from '#src/server/marine-licence/site-details/coordinates-entry/utils.js'
import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'

describe('#coordinatesEntryUtils (marine licence)', () => {
  describe('#getBackRoute', () => {
    test('should return the site name route', () => {
      const result = getBackRoute()

      expect(result).toBe(marineLicenceRoutes.MARINE_LICENCE_SITE_NAME)
    })
  })
})
