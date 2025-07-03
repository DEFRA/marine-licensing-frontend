import { COORDINATE_SYSTEMS } from '~/src/server/common/constants/exemptions.js'
import { routes } from '~/src/server/common/constants/routes.js'
import {
  multipleCoordinatesPageData,
  MULTIPLE_COORDINATES_VIEW_ROUTES
} from './utils.js'

describe('Multiple Coordinates Utils', () => {
  describe('multipleCoordinatesPageData', () => {
    it('should have correct structure', () => {
      expect(multipleCoordinatesPageData).toEqual({
        heading:
          'Enter multiple sets of coordinates to mark the boundary of the site',
        backLink: routes.COORDINATE_SYSTEM_CHOICE
      })
    })
  })

  describe('MULTIPLE_COORDINATES_VIEW_ROUTES', () => {
    it('should have correct route mappings', () => {
      expect(MULTIPLE_COORDINATES_VIEW_ROUTES).toEqual({
        [COORDINATE_SYSTEMS.WGS84]:
          'exemption/site-details/enter-multiple-coordinates/wgs84',
        [COORDINATE_SYSTEMS.OSGB36]:
          'exemption/site-details/enter-multiple-coordinates/osgb36'
      })
    })
  })
})
