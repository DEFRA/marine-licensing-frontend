import { routes } from '~/src/server/common/constants/routes.js'

import {
  mockExemption,
  setupTestServer
} from '#tests/integration/shared/test-setup-helpers.js'
import { makeGetRequest } from '~/src/server/test-helpers/server-requests.js'
import { sharedBeforeYouStartSiteDetailsTests } from './before-you-start-tests.js'

describe('Before you start site details page (exemption)', () => {
  const mockExemptionData = {
    id: 'test-exemption-123',
    projectName: 'Test Project'
  }

  const getServer = setupTestServer()

  beforeEach(() => {
    mockExemption(mockExemptionData)
  })

  sharedBeforeYouStartSiteDetailsTests({
    projectType: 'exemptions',
    request: () =>
      makeGetRequest({ server: getServer(), url: routes.SITE_DETAILS }),
    projectName: mockExemptionData.projectName,
    navLinks: {
      continueHref: '/exemption/how-do-you-want-to-provide-the-coordinates',
      backHref: '/exemption/task-list'
    }
  })
})
