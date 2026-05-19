import { marineLicenceRoutes } from '~/src/server/common/constants/routes.js'
import {
  mockActivityDetails,
  mockOutputActivityDetails
} from '~/src/server/test-helpers/mocks/marine-licence-mocks.js'

const baseMlPolygonMarineLicence = {
  id: 'test-ml-polygon-123',
  projectName: 'Hammersmith pontoon construction',
  multipleSiteDetails: {},
  publicRegister: {
    withholdFromPublicRegister: false
  },
  taskList: {
    projectName: { status: 'completed' },
    siteDetails: { status: 'completed' }
  }
}

export const testScenarios = [
  {
    name: 'WGS84 polygon coordinates - basic scenario',
    marineLicence: {
      ...baseMlPolygonMarineLicence,
      siteDetails: [
        {
          coordinatesType: 'coordinates',
          coordinatesEntry: 'multiple',
          coordinateSystem: 'wgs84',
          coordinates: [
            { latitude: '55.123456', longitude: '55.123456' },
            { latitude: '33.987654', longitude: '33.987654' },
            { latitude: '78.123456', longitude: '78.123456' }
          ],
          siteName: 'Test Site 1'
        }
      ]
    },
    expectedPageContent: {
      backLink: marineLicenceRoutes.MARINE_LICENCE_ENTER_MULTIPLE_COORDINATES,
      projectName: 'Hammersmith pontoon construction',
      siteDetails: [
        {
          cardName: 'Site 1',
          siteName: 'Test Site 1',
          method:
            'Enter multiple sets of coordinates to mark the boundary of the site',
          coordinateSystem:
            'WGS84 (World Geodetic System 1984)Latitude and longitude',
          polygonCoordinates: [
            { label: 'Start and end points', value: '55.123456, 55.123456' },
            { label: 'Point 2', value: '33.987654, 33.987654' },
            { label: 'Point 3', value: '78.123456, 78.123456' }
          ]
        }
      ]
    }
  },
  {
    name: 'OSGB36 polygon coordinates - basic scenario',
    marineLicence: {
      ...baseMlPolygonMarineLicence,
      siteDetails: [
        {
          coordinatesType: 'coordinates',
          coordinatesEntry: 'multiple',
          coordinateSystem: 'osgb36',
          coordinates: [
            { easting: '425053', northing: '564180' },
            { easting: '426000', northing: '565000' },
            { easting: '427000', northing: '566000' }
          ],
          siteName: 'Test Site 1'
        }
      ]
    },
    expectedPageContent: {
      backLink: marineLicenceRoutes.MARINE_LICENCE_ENTER_MULTIPLE_COORDINATES,
      projectName: 'Hammersmith pontoon construction',
      siteDetails: [
        {
          cardName: 'Site 1',
          siteName: 'Test Site 1',
          method:
            'Enter multiple sets of coordinates to mark the boundary of the site',
          coordinateSystem: 'OSGB36 (National Grid)Eastings and Northings',
          polygonCoordinates: [
            { label: 'Start and end points', value: '425053, 564180' },
            { label: 'Point 2', value: '426000, 565000' },
            { label: 'Point 3', value: '427000, 566000' }
          ]
        }
      ]
    }
  },
  {
    name: 'Multiple sites scenario - WGS84 polygon sites',
    marineLicence: {
      ...baseMlPolygonMarineLicence,
      multipleSiteDetails: {
        multipleSitesEnabled: true,
        sameActivityDates: 'yes',
        sameActivityDescription: 'yes'
      },
      siteDetails: [
        {
          coordinatesType: 'coordinates',
          coordinatesEntry: 'multiple',
          coordinateSystem: 'wgs84',
          coordinates: [
            { latitude: '55.123456', longitude: '55.123456' },
            { latitude: '33.987654', longitude: '33.987654' },
            { latitude: '78.123456', longitude: '78.123456' }
          ],
          siteName: 'Site 1'
        },
        {
          coordinatesType: 'coordinates',
          coordinatesEntry: 'multiple',
          coordinateSystem: 'wgs84',
          coordinates: [
            { latitude: '55.123456', longitude: '55.123456' },
            { latitude: '33.987654', longitude: '33.987654' },
            { latitude: '78.123456', longitude: '78.123456' }
          ],
          siteName: 'Site 2'
        }
      ]
    },
    expectedPageContent: {
      backLink: marineLicenceRoutes.MARINE_LICENCE_ENTER_MULTIPLE_COORDINATES,
      projectName: 'Hammersmith pontoon construction',
      siteDetails: [
        {
          cardName: 'Site 1',
          siteName: 'Site 1',
          method:
            'Enter multiple sets of coordinates to mark the boundary of the site',
          coordinateSystem:
            'WGS84 (World Geodetic System 1984)Latitude and longitude',
          polygonCoordinates: [
            { label: 'Start and end points', value: '55.123456, 55.123456' },
            { label: 'Point 2', value: '33.987654, 33.987654' },
            { label: 'Point 3', value: '78.123456, 78.123456' }
          ]
        },
        {
          cardName: 'Site 2',
          siteName: 'Site 2',
          method:
            'Enter multiple sets of coordinates to mark the boundary of the site',
          coordinateSystem:
            'WGS84 (World Geodetic System 1984)Latitude and longitude',
          polygonCoordinates: [
            { label: 'Start and end points', value: '55.123456, 55.123456' },
            { label: 'Point 2', value: '33.987654, 33.987654' },
            { label: 'Point 3', value: '78.123456, 78.123456' }
          ]
        }
      ]
    }
  },
  {
    name: 'WGS84 polygon coordinates - with activity details',
    marineLicence: {
      ...baseMlPolygonMarineLicence,
      siteDetails: [
        {
          coordinatesType: 'coordinates',
          coordinatesEntry: 'multiple',
          coordinateSystem: 'wgs84',
          coordinates: [
            { latitude: '55.123456', longitude: '55.123456' },
            { latitude: '33.987654', longitude: '33.987654' },
            { latitude: '78.123456', longitude: '78.123456' }
          ],
          siteName: 'Test Site 1',
          activityDetails: [mockActivityDetails]
        }
      ]
    },
    expectedPageContent: {
      backLink: marineLicenceRoutes.MARINE_LICENCE_ENTER_MULTIPLE_COORDINATES,
      projectName: 'Hammersmith pontoon construction',
      siteDetails: [
        {
          cardName: 'Site 1',
          siteName: 'Test Site 1',
          method:
            'Enter multiple sets of coordinates to mark the boundary of the site',
          coordinateSystem:
            'WGS84 (World Geodetic System 1984)Latitude and longitude',
          polygonCoordinates: [
            { label: 'Start and end points', value: '55.123456, 55.123456' },
            { label: 'Point 2', value: '33.987654, 33.987654' },
            { label: 'Point 3', value: '78.123456, 78.123456' }
          ],
          activityDetails: [mockOutputActivityDetails]
        }
      ]
    }
  },
  {
    name: 'Multiple sites scenario - mixed coordinate systems',
    marineLicence: {
      ...baseMlPolygonMarineLicence,
      multipleSiteDetails: {
        multipleSitesEnabled: true,
        sameActivityDates: 'no',
        sameActivityDescription: 'no'
      },
      siteDetails: [
        {
          coordinatesType: 'coordinates',
          coordinatesEntry: 'multiple',
          coordinateSystem: 'wgs84',
          coordinates: [
            { latitude: '55.123456', longitude: '55.123456' },
            { latitude: '33.987654', longitude: '33.987654' },
            { latitude: '78.123456', longitude: '78.123456' }
          ],
          siteName: 'Site 1'
        },
        {
          coordinatesType: 'coordinates',
          coordinatesEntry: 'multiple',
          coordinateSystem: 'osgb36',
          coordinates: [
            { easting: '425053', northing: '564180' },
            { easting: '426000', northing: '565000' },
            { easting: '427000', northing: '566000' }
          ],
          siteName: 'Site 2'
        }
      ]
    },
    expectedPageContent: {
      backLink: marineLicenceRoutes.MARINE_LICENCE_ENTER_MULTIPLE_COORDINATES,
      projectName: 'Hammersmith pontoon construction',
      siteDetails: [
        {
          cardName: 'Site 1',
          siteName: 'Site 1',
          method:
            'Enter multiple sets of coordinates to mark the boundary of the site',
          coordinateSystem:
            'WGS84 (World Geodetic System 1984)Latitude and longitude',
          polygonCoordinates: [
            { label: 'Start and end points', value: '55.123456, 55.123456' },
            { label: 'Point 2', value: '33.987654, 33.987654' },
            { label: 'Point 3', value: '78.123456, 78.123456' }
          ]
        },
        {
          cardName: 'Site 2',
          siteName: 'Site 2',
          method:
            'Enter multiple sets of coordinates to mark the boundary of the site',
          coordinateSystem: 'OSGB36 (National Grid)Eastings and Northings',
          polygonCoordinates: [
            { label: 'Start and end points', value: '425053, 564180' },
            { label: 'Point 2', value: '426000, 565000' },
            { label: 'Point 3', value: '427000, 566000' }
          ]
        }
      ]
    }
  }
]
