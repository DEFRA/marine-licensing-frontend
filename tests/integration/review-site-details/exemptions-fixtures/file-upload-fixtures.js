import { COORDINATE_SYSTEMS } from '~/src/server/common/constants/exemptions.js'
import { mockFileUploadExemption } from '~/src/server/test-helpers/mocks/exemption.js'

const baseFileUploadExemption = {
  multipleSiteDetails: {
    multipleSitesEnabled: false,
    sameActivityDates: 'no',
    sameActivityDescrption: 'no'
  },
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
    siteDetails: {
      status: 'completed'
    },
    publicRegister: { status: 'completed' }
  },
  siteDetails: [mockFileUploadExemption.siteDetails[0]]
}

export const testScenarios = [
  {
    name: 'File Upload - KML - Single Site',
    coordinateSystem: COORDINATE_SYSTEMS.WGS84,
    exemption: baseFileUploadExemption,
    expectedPageContent: {
      projectName: 'Hammersmith pontoon construction',
      multipleSiteDetails: {
        multipleSiteDetails: 'No',
        method: 'Upload a file with the coordinates of the site',
        fileType: 'KML',
        fileUploaded: 'test-upload-id'
      },
      siteDetails: [
        {
          cardName: 'Site details',
          activityDates: '1 January 2025 to 1 January 2025',
          activityDescription: 'Test activity description'
        }
      ]
    }
  },
  {
    name: 'File Upload - KML - Multiple Sites - Same Dates and Description',
    coordinateSystem: COORDINATE_SYSTEMS.WGS84,
    exemption: {
      ...baseFileUploadExemption,
      multipleSiteDetails: {
        multipleSitesEnabled: true,
        sameActivityDates: 'yes',
        sameActivityDescription: 'yes'
      },
      siteDetails: [
        {
          ...mockFileUploadExemption.siteDetails[0],
          siteName: null
        },
        {
          ...mockFileUploadExemption.siteDetails[0],
          siteName: 'test site name 2'
        }
      ]
    },
    expectedPageContent: {
      projectName: 'Hammersmith pontoon construction',
      multipleSiteDetails: {
        multipleSiteDetails: 'Yes',
        method: 'Upload a file with the coordinates of the site',
        fileType: 'KML',
        fileUploaded: 'test-upload-id',
        sameActivityDates: 'Yes',
        sameActivityDescription: 'Yes',
        activityDates: '1 January 2025 to 1 January 2025',
        activityDescription: 'Test activity description',
        warning: true
      },
      siteDetails: [
        { siteName: 'Incomplete', cardName: 'Site 1 details' },
        { siteName: 'test site name 2', cardName: 'Site 2 details' }
      ]
    }
  },
  {
    name: 'File Upload - KML - Multiple Sites - Variable Dates and Description',
    coordinateSystem: COORDINATE_SYSTEMS.WGS84,
    exemption: {
      ...baseFileUploadExemption,
      multipleSiteDetails: {
        multipleSitesEnabled: true,
        sameActivityDates: 'no',
        sameActivityDescription: 'no'
      },
      siteDetails: [
        {
          ...mockFileUploadExemption.siteDetails[0],
          siteName: null
        },
        {
          ...mockFileUploadExemption.siteDetails[0],
          siteName: 'test site name 2'
        }
      ]
    },
    expectedPageContent: {
      projectName: 'Hammersmith pontoon construction',
      multipleSiteDetails: {
        multipleSiteDetails: 'Yes',
        method: 'Upload a file with the coordinates of the site',
        fileType: 'KML',
        fileUploaded: 'test-upload-id',
        sameActivityDates: 'No',
        sameActivityDescription: 'No',
        warning: true
      },
      siteDetails: [
        {
          siteName: 'Incomplete',
          cardName: 'Site 1 details',
          activityDates: '1 January 2025 to 1 January 2025',
          activityDescription: 'Test activity description'
        },
        {
          siteName: 'test site name 2',
          cardName: 'Site 2 details',
          activityDates: '1 January 2025 to 1 January 2025',
          activityDescription: 'Test activity description'
        }
      ]
    }
  }
]
