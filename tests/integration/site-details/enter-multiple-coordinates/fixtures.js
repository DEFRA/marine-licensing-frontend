import { mockExemptionNoSiteDetails } from '~/src/server/test-helpers/mocks/exemption.js'
import { COORDINATE_SYSTEMS } from '~/src/server/common/constants/coordinate-systems.js'

export const wgs84Coordinates = [
  { latitude: '51.507400', longitude: '-0.127800' },
  { latitude: '51.517500', longitude: '-0.137600' },
  { latitude: '51.527600', longitude: '-0.147700' }
]

export const osgb36Coordinates = [
  { easting: '530000', northing: '181000' },
  { easting: '530100', northing: '181100' },
  { easting: '530200', northing: '181200' }
]

export const exemptionWgs84Coordinates = {
  ...mockExemptionNoSiteDetails,
  siteDetails: [
    {
      coordinatesType: 'coordinates',
      coordinatesEntry: 'multiple',
      coordinateSystem: COORDINATE_SYSTEMS.WGS84,
      coordinates: wgs84Coordinates
    }
  ]
}

export const exemptionOsgb36Coordinates = {
  ...mockExemptionNoSiteDetails,
  siteDetails: [
    {
      coordinatesType: 'coordinates',
      coordinatesEntry: 'multiple',
      coordinateSystem: COORDINATE_SYSTEMS.OSGB36,
      coordinates: osgb36Coordinates
    }
  ]
}

export const exemptionWgs84EmptyCoordinates = {
  ...mockExemptionNoSiteDetails,
  siteDetails: [
    {
      coordinatesType: 'coordinates',
      coordinatesEntry: 'multiple',
      coordinateSystem: COORDINATE_SYSTEMS.WGS84,
      coordinates: []
    }
  ]
}
