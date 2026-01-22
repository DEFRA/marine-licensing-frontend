import { mockExemptionNoSiteDetails } from '~/src/server/test-helpers/mocks/exemption.js'
import { COORDINATE_SYSTEMS } from '~/src/server/common/constants/exemptions.js'

export const exemptionWgs84Coordinates = {
  ...mockExemptionNoSiteDetails,
  siteDetails: [
    {
      coordinatesType: 'coordinates',
      coordinatesEntry: 'multiple',
      coordinateSystem: COORDINATE_SYSTEMS.WGS84
    }
  ]
}

export const exemptionOsgb36Coordinates = {
  ...mockExemptionNoSiteDetails,
  siteDetails: [
    {
      coordinatesType: 'coordinates',
      coordinatesEntry: 'multiple',
      coordinateSystem: COORDINATE_SYSTEMS.OSGB36
    }
  ]
}
