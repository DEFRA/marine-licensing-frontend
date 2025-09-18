import { COORDINATE_SYSTEMS } from '~/src/server/common/constants/exemptions.js'

const basePolygonExemption = {
  id: 'test-polygon-exemption-123',
  projectName: 'Hammersmith pontoon construction',
  activityDates: {
    start: '2025-07-01',
    end: '2025-07-07'
  },
  activityDescription:
    'We will be installing a pontoon approximately 20 metres squared at the east of our garden that backs onto the river.',
  publicRegister: {
    withholdFromPublicRegister: false
  },
  taskList: {
    projectName: { status: 'completed' },
    activityDates: { status: 'completed' },
    activityDescription: { status: 'completed' },
    siteDetails: { status: 'completed' },
    publicRegister: { status: 'completed' }
  }
}

export const testScenarios = [
  {
    name: 'WGS84 polygon coordinates - basic scenario',
    coordinateSystem: COORDINATE_SYSTEMS.WGS84,
    exemption: {
      ...basePolygonExemption,
      siteDetails: [
        {
          coordinatesType: 'coordinates',
          coordinatesEntry: 'multiple',
          coordinateSystem: 'wgs84',
          coordinates: [
            { latitude: '55.123456', longitude: '55.123456' },
            { latitude: '33.987654', longitude: '33.987654' },
            { latitude: '78.123456', longitude: '78.123456' }
          ]
        }
      ]
    },
    expectedPageContent: {
      projectName: 'Hammersmith pontoon construction',
      siteDetails: {
        method:
          'Manually enter multiple sets of coordinates to mark the boundary of the site',
        coordinateSystem:
          'WGS84 (World Geodetic System 1984)Latitude and longitude',
        polygonCoordinates: [
          {
            label: 'Start and end points',
            value: '55.123456, 55.123456'
          },
          {
            label: 'Point 2',
            value: '33.987654, 33.987654'
          },
          {
            label: 'Point 3',
            value: '78.123456, 78.123456'
          }
        ]
      }
    }
  },
  {
    name: 'OSGB36 polygon coordinates - basic scenario',
    coordinateSystem: COORDINATE_SYSTEMS.OSGB36,
    exemption: {
      ...basePolygonExemption,
      siteDetails: [
        {
          coordinatesType: 'coordinates',
          coordinatesEntry: 'multiple',
          coordinateSystem: 'osgb36',
          coordinates: [
            { eastings: '425053', northings: '564180' },
            { eastings: '426000', northings: '565000' },
            { eastings: '427000', northings: '566000' }
          ]
        }
      ]
    },
    expectedPageContent: {
      projectName: 'Hammersmith pontoon construction',
      siteDetails: {
        method:
          'Manually enter multiple sets of coordinates to mark the boundary of the site',
        coordinateSystem: 'OSGB36 (National Grid)Eastings and Northings',
        polygonCoordinates: [
          {
            label: 'Start and end points',
            value: '425053, 564180'
          },
          {
            label: 'Point 2',
            value: '426000, 565000'
          },
          {
            label: 'Point 3',
            value: '427000, 566000'
          }
        ]
      }
    }
  },
  {
    name: 'WGS84 polygon coordinates - extended with additional points (ML-38)',
    coordinateSystem: COORDINATE_SYSTEMS.WGS84,
    exemption: {
      ...basePolygonExemption,
      siteDetails: [
        {
          coordinatesType: 'coordinates',
          coordinatesEntry: 'multiple',
          coordinateSystem: 'wgs84',
          coordinates: [
            { latitude: '55.123456', longitude: '55.123456' },
            { latitude: '33.987654', longitude: '33.987654' },
            { latitude: '78.123456', longitude: '78.123456' },
            { latitude: '45.678901', longitude: '45.678901' },
            { latitude: '56.789012', longitude: '56.789012' }
          ]
        }
      ]
    },
    expectedPageContent: {
      projectName: 'Hammersmith pontoon construction',
      siteDetails: {
        method:
          'Manually enter multiple sets of coordinates to mark the boundary of the site',
        coordinateSystem:
          'WGS84 (World Geodetic System 1984)Latitude and longitude',
        polygonCoordinates: [
          {
            label: 'Start and end points',
            value: '55.123456, 55.123456'
          },
          {
            label: 'Point 2',
            value: '33.987654, 33.987654'
          },
          {
            label: 'Point 3',
            value: '78.123456, 78.123456'
          },
          {
            label: 'Point 4',
            value: '45.678901, 45.678901'
          },
          {
            label: 'Point 5',
            value: '56.789012, 56.789012'
          }
        ]
      }
    }
  },
  {
    name: 'OSGB36 polygon coordinates - extended with additional points (ML-38)',
    coordinateSystem: COORDINATE_SYSTEMS.OSGB36,
    exemption: {
      ...basePolygonExemption,
      siteDetails: [
        {
          coordinatesType: 'coordinates',
          coordinatesEntry: 'multiple',
          coordinateSystem: 'osgb36',
          coordinates: [
            { eastings: '425053', northings: '564180' },
            { eastings: '426000', northings: '565000' },
            { eastings: '427000', northings: '566000' },
            { eastings: '428000', northings: '567000' },
            { eastings: '429000', northings: '568000' },
            { eastings: '430000', northings: '569000' }
          ]
        }
      ]
    },
    expectedPageContent: {
      projectName: 'Hammersmith pontoon construction',
      siteDetails: {
        method:
          'Manually enter multiple sets of coordinates to mark the boundary of the site',
        coordinateSystem: 'OSGB36 (National Grid)Eastings and Northings',
        polygonCoordinates: [
          {
            label: 'Start and end points',
            value: '425053, 564180'
          },
          {
            label: 'Point 2',
            value: '426000, 565000'
          },
          {
            label: 'Point 3',
            value: '427000, 566000'
          },
          {
            label: 'Point 4',
            value: '428000, 567000'
          },
          {
            label: 'Point 5',
            value: '429000, 568000'
          },
          {
            label: 'Point 6',
            value: '430000, 569000'
          }
        ]
      }
    }
  },
  {
    name: 'Multiple sites scenario',
    coordinateSystem: COORDINATE_SYSTEMS.WGS84,
    exemption: {
      ...basePolygonExemption,
      multipleSiteDetails: { multipleSitesEnabled: true },
      siteDetails: [
        {
          coordinatesType: 'coordinates',
          coordinatesEntry: 'multiple',
          coordinateSystem: 'wgs84',
          coordinates: [
            { latitude: '55.123456', longitude: '55.123456' },
            { latitude: '33.987654', longitude: '33.987654' },
            { latitude: '78.123456', longitude: '78.123456' }
          ]
        },
        {
          coordinatesType: 'coordinates',
          coordinatesEntry: 'multiple',
          coordinateSystem: 'wgs84',
          coordinates: [
            { latitude: '55.123456', longitude: '55.123456' },
            { latitude: '33.987654', longitude: '33.987654' },
            { latitude: '78.123456', longitude: '78.123456' }
          ]
        }
      ]
    },
    expectedPageContent: {
      projectName: 'Hammersmith pontoon construction',
      siteDetails: {
        method:
          'Manually enter multiple sets of coordinates to mark the boundary of the site',
        coordinateSystem:
          'WGS84 (World Geodetic System 1984)Latitude and longitude',
        polygonCoordinates: [
          {
            label: 'Start and end points',
            value: '55.123456, 55.123456'
          },
          {
            label: 'Point 2',
            value: '33.987654, 33.987654'
          },
          {
            label: 'Point 3',
            value: '78.123456, 78.123456'
          }
        ]
      }
    }
  }
]
