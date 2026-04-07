import { routes } from '#src/server/common/constants/routes.js'
import { COORDINATE_SYSTEMS } from '~/src/server/common/constants/exemptions.js'
import { mockExemption } from '~/src/server/test-helpers/mocks/exemption.js'

const baseCircularExemption = {
  multipleSiteDetails: {
    multipleSiteDetails: false,
    sameActivityDates: 'no',
    sameActivityDescrption: 'no'
  },
  id: 'test-circular-exemption-123',
  projectName: 'Hammersmith pontoon construction',
  publicRegister: {
    withholdFromPublicRegister: false
  },
  taskList: {
    projectName: { status: 'completed' },
    activityDates: { status: 'completed' },
    activityDescription: { status: 'completed' },
    siteDetails: {
      status: 'completed'
    },
    publicRegister: { status: 'completed' }
  }
}

export const testScenarios = [
  {
    name: 'WGS84 circular coordinates - basic scenario',
    coordinateSystem: COORDINATE_SYSTEMS.WGS84,
    exemption: {
      ...baseCircularExemption,
      siteDetails: [
        {
          activityDates: {
            start: '2025-01-01T00:00:00.000Z',
            end: '2025-01-01T00:00:00.000Z'
          },
          activityDescription: 'Test activity description',
          coordinatesType: 'coordinates',
          coordinatesEntry: 'single',
          coordinateSystem: 'wgs84',
          coordinates: { latitude: '55.123456', longitude: '55.123456' },
          circleWidth: '100'
        }
      ]
    },
    expectedPageContent: {
      backLink: routes.WIDTH_OF_SITE,
      projectName: 'Hammersmith pontoon construction',
      multipleSiteDetails: {
        method: 'Enter the coordinates of the site manually',
        multipleSiteDetails: 'No'
      },
      siteDetails: [
        {
          activityDates: '1 January 2025 to 1 January 2025',
          activityDescription: 'Test activity description',
          cardName: 'Site details',
          method:
            'Enter one set of coordinates and a width to create a circular site',
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
    coordinateSystem: COORDINATE_SYSTEMS.OSGB36,
    exemption: {
      ...baseCircularExemption,
      siteDetails: [
        {
          activityDates: {
            start: '2025-01-01T00:00:00.000Z',
            end: '2025-01-01T00:00:00.000Z'
          },
          activityDescription: 'Test activity description',
          coordinatesType: 'coordinates',
          coordinatesEntry: 'single',
          coordinateSystem: 'osgb36',
          coordinates: { eastings: '425053', northings: '564180' },
          circleWidth: '250'
        }
      ]
    },
    expectedPageContent: {
      backLink: routes.WIDTH_OF_SITE,
      projectName: 'Hammersmith pontoon construction',
      multipleSiteDetails: {
        method: 'Enter the coordinates of the site manually',
        multipleSiteDetails: 'No'
      },
      siteDetails: [
        {
          activityDates: '1 January 2025 to 1 January 2025',
          activityDescription: 'Test activity description',
          cardName: 'Site details',
          method:
            'Enter one set of coordinates and a width to create a circular site',
          coordinateSystem:
            'British National Grid (OSGB36)Eastings and Northings',
          centreCoordinates: '425053, 564180',
          circleWidth: '250 metres'
        }
      ]
    }
  },
  {
    name: 'Multiple sites scenario with circular sites - same dates and description',
    coordinateSystem: COORDINATE_SYSTEMS.WGS84,
    exemption: {
      ...baseCircularExemption,
      multipleSiteDetails: {
        multipleSitesEnabled: true,
        sameActivityDates: 'yes',
        sameActivityDescription: 'yes'
      },
      siteDetails: [
        {
          activityDates: mockExemption.siteDetails[0].activityDates,
          activityDescription: mockExemption.siteDetails[0].activityDescription,
          siteName: 'Site 1',
          coordinatesType: 'coordinates',
          coordinatesEntry: 'single',
          coordinateSystem: 'wgs84',
          coordinates: { latitude: '55.123456', longitude: '55.123456' },
          circleWidth: '100'
        },
        {
          activityDates: mockExemption.siteDetails[1].activityDates,
          activityDescription: mockExemption.siteDetails[1].activityDescription,
          siteName: 'Site 2',
          coordinatesType: 'coordinates',
          coordinatesEntry: 'single',
          coordinateSystem: 'wgs84',
          coordinates: { latitude: '51.489676', longitude: '-0.231530' },
          circleWidth: '200'
        }
      ]
    },
    expectedPageContent: {
      backLink: routes.WIDTH_OF_SITE,
      projectName: 'Hammersmith pontoon construction',
      multipleSiteDetails: {
        method: 'Enter the coordinates of the site manually',
        multipleSiteDetails: 'Yes',
        sameActivityDates: 'Yes',
        sameActivityDescription: 'Yes',
        activityDates: '1 January 2025 to 1 January 2025',
        activityDescription: 'Test activity description'
      },
      siteDetails: [
        {
          siteName: 'Site 1',
          cardName: 'Site 1 details',
          method:
            'Enter one set of coordinates and a width to create a circular site',
          coordinateSystem:
            'WGS84 (World Geodetic System 1984)Latitude and longitude',
          centreCoordinates: '55.123456, 55.123456',
          circleWidth: '100 metres'
        },
        {
          siteName: 'Site 2',
          cardName: 'Site 2 details',
          method:
            'Enter one set of coordinates and a width to create a circular site',
          coordinateSystem:
            'WGS84 (World Geodetic System 1984)Latitude and longitude',
          centreCoordinates: '51.489676, -0.231530',
          circleWidth: '200 metres'
        }
      ]
    }
  },
  {
    name: 'Multiple sites scenario with circular sites - variable dates and description',
    coordinateSystem: COORDINATE_SYSTEMS.WGS84,
    exemption: {
      ...baseCircularExemption,
      multipleSiteDetails: {
        multipleSitesEnabled: true,
        sameActivityDates: 'no',
        sameActivityDescription: 'no'
      },
      siteDetails: [
        {
          activityDates: mockExemption.siteDetails[0].activityDates,
          activityDescription: mockExemption.siteDetails[0].activityDescription,
          siteName: 'Site 1',
          coordinatesType: 'coordinates',
          coordinatesEntry: 'single',
          coordinateSystem: 'wgs84',
          coordinates: { latitude: '55.123456', longitude: '55.123456' },
          circleWidth: '100'
        },
        {
          activityDates: mockExemption.siteDetails[1].activityDates,
          activityDescription: mockExemption.siteDetails[1].activityDescription,
          siteName: 'Site 2',
          coordinatesType: 'coordinates',
          coordinatesEntry: 'single',
          coordinateSystem: 'osgb36',
          coordinates: { eastings: '425053', northings: '564180' },
          circleWidth: '300'
        }
      ]
    },
    expectedPageContent: {
      backLink: routes.WIDTH_OF_SITE,
      projectName: 'Hammersmith pontoon construction',
      multipleSiteDetails: {
        method: 'Enter the coordinates of the site manually',
        multipleSiteDetails: 'Yes',
        sameActivityDates: 'No',
        sameActivityDescription: 'No'
      },
      siteDetails: [
        {
          siteName: 'Site 1',
          cardName: 'Site 1 details',
          activityDates: '1 January 2025 to 1 January 2025',
          activityDescription: 'Test activity description',
          method:
            'Enter one set of coordinates and a width to create a circular site',
          coordinateSystem:
            'WGS84 (World Geodetic System 1984)Latitude and longitude',
          centreCoordinates: '55.123456, 55.123456',
          circleWidth: '100 metres'
        },
        {
          siteName: 'Site 2',
          cardName: 'Site 2 details',
          activityDates: '1 February 2025 to 1 February 2025',
          activityDescription: 'Test activity description',
          method:
            'Enter one set of coordinates and a width to create a circular site',
          coordinateSystem:
            'British National Grid (OSGB36)Eastings and Northings',
          centreCoordinates: '425053, 564180',
          circleWidth: '300 metres'
        }
      ]
    }
  }
]
