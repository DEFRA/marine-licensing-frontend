import { mockMarineLicenceApplication } from '~/src/server/test-helpers/mocks/marine-licence-mocks.js'
import { marineLicenceRoutes } from '~/src/server/common/constants/routes.js'

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
          ...mockMarineLicenceApplication.siteDetails[0]
        }
      ]
    }
  },
  {
    name: 'File Upload - KML - Incomplete site details (missing site name)',
    marineLicence: {
      ...mockMarineLicenceApplication,
      siteDetails: [
        { ...mockMarineLicenceApplication.siteDetails[0], siteName: '' }
      ]
    },
    expectedPageContent: {
      projectName: 'Test Project',
      backLink: marineLicenceRoutes.MARINE_LICENCE_FILE_UPLOAD,
      hasIncompleteWarning: true,
      siteDetails: [
        {
          ...mockMarineLicenceApplication.siteDetails[0],
          siteName: null
        }
      ]
    }
  }
]
