import { marineLicenceRoutes } from '~/src/server/common/constants/routes.js'
import {
  mockActivityDetails,
  mockOutputActivityDetails
} from '~/src/server/test-helpers/mocks/marine-licence-mocks.js'

const baseMlCircularMarineLicence = {
  id: 'test-ml-circular-123',
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
    name: 'WGS84 circular coordinates - basic scenario',
    marineLicence: {
      ...baseMlCircularMarineLicence,
      siteDetails: [
        {
          coordinatesType: 'coordinates',
          coordinatesEntry: 'single',
          coordinateSystem: 'wgs84',
          coordinates: { latitude: '55.123456', longitude: '55.123456' },
          circleWidth: '100',
          siteName: 'Test Site 1'
        }
      ]
    },
    expectedPageContent: {
      backLink: marineLicenceRoutes.MARINE_LICENCE_WIDTH_OF_SITE,
      projectName: 'Hammersmith pontoon construction',
      siteDetails: [
        {
          cardName: 'Site 1',
          siteName: 'Test Site 1',
          method:
            'Manually enter one set of coordinates and a width to create a circular site',
          coordinateSystem:
            'WGS84 (World Geodetic System 1984)Latitude and longitude',
          centreCoordinates: '55.123456, 55.123456',
          circleWidth: '100 metres'
        }
      ]
    }
  },
  {
    name: 'OSGB36 circular coordinates - basic scenario',
    marineLicence: {
      ...baseMlCircularMarineLicence,
      siteDetails: [
        {
          coordinatesType: 'coordinates',
          coordinatesEntry: 'single',
          coordinateSystem: 'osgb36',
          coordinates: { easting: '425053', northing: '564180' },
          circleWidth: '250',
          siteName: 'Test Site 1'
        }
      ]
    },
    expectedPageContent: {
      backLink: marineLicenceRoutes.MARINE_LICENCE_WIDTH_OF_SITE,
      projectName: 'Hammersmith pontoon construction',
      siteDetails: [
        {
          cardName: 'Site 1',
          siteName: 'Test Site 1',
          method:
            'Manually enter one set of coordinates and a width to create a circular site',
          coordinateSystem: 'OSGB36 (National Grid)Eastings and Northings',
          centreCoordinates: '425053, 564180',
          circleWidth: '250 metres'
        }
      ]
    }
  },
  {
    name: 'Multiple sites scenario - WGS84 circular sites',
    marineLicence: {
      ...baseMlCircularMarineLicence,
      multipleSiteDetails: {
        multipleSitesEnabled: true,
        sameActivityDates: 'yes',
        sameActivityDescription: 'yes'
      },
      siteDetails: [
        {
          coordinatesType: 'coordinates',
          coordinatesEntry: 'single',
          coordinateSystem: 'wgs84',
          coordinates: { latitude: '55.123456', longitude: '55.123456' },
          circleWidth: '100',
          siteName: 'Site 1'
        },
        {
          coordinatesType: 'coordinates',
          coordinatesEntry: 'single',
          coordinateSystem: 'wgs84',
          coordinates: { latitude: '51.489676', longitude: '-0.231530' },
          circleWidth: '200',
          siteName: 'Site 2'
        }
      ]
    },
    expectedPageContent: {
      backLink: marineLicenceRoutes.MARINE_LICENCE_WIDTH_OF_SITE,
      projectName: 'Hammersmith pontoon construction',
      siteDetails: [
        {
          cardName: 'Site 1',
          siteName: 'Site 1',
          method:
            'Manually enter one set of coordinates and a width to create a circular site',
          coordinateSystem:
            'WGS84 (World Geodetic System 1984)Latitude and longitude',
          centreCoordinates: '55.123456, 55.123456',
          circleWidth: '100 metres'
        },
        {
          cardName: 'Site 2',
          siteName: 'Site 2',
          method:
            'Manually enter one set of coordinates and a width to create a circular site',
          coordinateSystem:
            'WGS84 (World Geodetic System 1984)Latitude and longitude',
          centreCoordinates: '51.489676, -0.231530',
          circleWidth: '200 metres'
        }
      ]
    }
  },
  {
    name: 'WGS84 circular coordinates - with activity details',
    marineLicence: {
      ...baseMlCircularMarineLicence,
      siteDetails: [
        {
          coordinatesType: 'coordinates',
          coordinatesEntry: 'single',
          coordinateSystem: 'wgs84',
          coordinates: { latitude: '55.123456', longitude: '55.123456' },
          circleWidth: '100',
          siteName: 'Test Site 1',
          activityDetails: [mockActivityDetails]
        }
      ]
    },
    expectedPageContent: {
      backLink: marineLicenceRoutes.MARINE_LICENCE_WIDTH_OF_SITE,
      projectName: 'Hammersmith pontoon construction',
      siteDetails: [
        {
          cardName: 'Site 1',
          siteName: 'Test Site 1',
          method:
            'Manually enter one set of coordinates and a width to create a circular site',
          coordinateSystem:
            'WGS84 (World Geodetic System 1984)Latitude and longitude',
          centreCoordinates: '55.123456, 55.123456',
          circleWidth: '100 metres',
          activityDetails: [mockOutputActivityDetails]
        }
      ]
    }
  },
  {
    name: 'Multiple sites scenario - mixed coordinate systems',
    marineLicence: {
      ...baseMlCircularMarineLicence,
      multipleSiteDetails: {
        multipleSitesEnabled: true,
        sameActivityDates: 'no',
        sameActivityDescription: 'no'
      },
      siteDetails: [
        {
          coordinatesType: 'coordinates',
          coordinatesEntry: 'single',
          coordinateSystem: 'wgs84',
          coordinates: { latitude: '55.123456', longitude: '55.123456' },
          circleWidth: '100',
          siteName: 'Site 1'
        },
        {
          coordinatesType: 'coordinates',
          coordinatesEntry: 'single',
          coordinateSystem: 'osgb36',
          coordinates: { easting: '425053', northing: '564180' },
          circleWidth: '300',
          siteName: 'Site 2'
        }
      ]
    },
    expectedPageContent: {
      backLink: marineLicenceRoutes.MARINE_LICENCE_WIDTH_OF_SITE,
      projectName: 'Hammersmith pontoon construction',
      siteDetails: [
        {
          cardName: 'Site 1',
          siteName: 'Site 1',
          method:
            'Manually enter one set of coordinates and a width to create a circular site',
          coordinateSystem:
            'WGS84 (World Geodetic System 1984)Latitude and longitude',
          centreCoordinates: '55.123456, 55.123456',
          circleWidth: '100 metres'
        },
        {
          cardName: 'Site 2',
          siteName: 'Site 2',
          method:
            'Manually enter one set of coordinates and a width to create a circular site',
          coordinateSystem: 'OSGB36 (National Grid)Eastings and Northings',
          centreCoordinates: '425053, 564180',
          circleWidth: '300 metres'
        }
      ]
    }
  }
]
