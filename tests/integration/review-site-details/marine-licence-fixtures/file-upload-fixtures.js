import { mockMarineLicenceApplication } from '~/src/server/test-helpers/mocks/marine-licence-mocks.js'
import { marineLicenceRoutes } from '~/src/server/common/constants/routes.js'
import {
  mockEmptyActivityDetails,
  mockOutputActivityDetails,
  mockOutputEmptyActivityDetails
} from '#src/server/test-helpers/mocks/marine-licence-mocks.js'

export const testScenarios = [
  {
    name: 'File Upload - KML - Complete site details',
    marineLicence: mockMarineLicenceApplication,
    expectedPageContent: {
      projectName: 'Test Project',
      backLink: marineLicenceRoutes.MARINE_LICENCE_FILE_UPLOAD,
      hasIncompleteWarning: false,
      siteDetails: [
        {
          ...mockMarineLicenceApplication.siteDetails[0],
          activityDetails: [mockOutputActivityDetails]
        }
      ]
    }
  },
  {
    name: 'File Upload - KML - Incomplete site details (missing site name)',
    marineLicence: {
      ...mockMarineLicenceApplication,
      siteDetails: [
        {
          ...mockMarineLicenceApplication.siteDetails[0],
          siteName: '',
          activityDetails: [mockEmptyActivityDetails]
        }
      ]
    },
    expectedPageContent: {
      projectName: 'Test Project',
      backLink: marineLicenceRoutes.MARINE_LICENCE_FILE_UPLOAD,
      hasIncompleteWarning: true,
      siteDetails: [
        {
          ...mockMarineLicenceApplication.siteDetails[0],
          siteName: null,
          activityDetails: [mockOutputEmptyActivityDetails]
        }
      ]
    }
  }
]
