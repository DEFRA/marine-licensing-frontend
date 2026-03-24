import { marineLicenceRoutes } from '~/src/server/common/constants/routes.js'

import {
  mockMarineLicence,
  setupTestServer
} from '../../shared/test-setup-helpers.js'
import { makeGetRequest } from '~/src/server/test-helpers/server-requests.js'
import { sharedBeforeYouStartSiteDetailsTests } from './before-you-start-tests.js'

describe('Before you start site details page (marine licence)', () => {
  const mockMarineLicenceData = {
    id: 'test-marine-licence-123',
    projectName: 'Test Marine Project'
  }

  const getServer = setupTestServer()

  beforeEach(() => {
    mockMarineLicence(mockMarineLicenceData)
  })

  sharedBeforeYouStartSiteDetailsTests({
    projectType: 'marineLicence',
    request: () =>
      makeGetRequest({
        server: getServer(),
        url: marineLicenceRoutes.MARINE_LICENCE_SITE_DETAILS
      }),
    projectName: mockMarineLicenceData.projectName,
    navLinks: {
      continueHref: marineLicenceRoutes.MARINE_LICENCE_SITE_DETAILS,
      backHref: marineLicenceRoutes.MARINE_LICENCE_TASK_LIST
    }
  })
})
