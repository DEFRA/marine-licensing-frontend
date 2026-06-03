import { marineLicenceRoutes } from '~/src/server/common/constants/routes.js'
import {
  mockMarineLicence,
  setupTestServer
} from '../../../shared/test-setup-helpers.js'
import { makeGetRequest } from '~/src/server/test-helpers/server-requests.js'
import { sharedWaterDirectiveBeforeYouStartTests } from './before-you-start-tests.js'

describe('Water Framework Directive before you start page (marine licence)', () => {
  const mockMarineLicenceData = {
    id: 'test-marine-licence-123',
    projectName: 'Test Marine Project'
  }

  const getServer = setupTestServer()

  beforeEach(() => {
    mockMarineLicence(mockMarineLicenceData)
  })

  sharedWaterDirectiveBeforeYouStartTests({
    request: () =>
      makeGetRequest({
        server: getServer(),
        url: marineLicenceRoutes.MARINE_LICENCE_WATER_FRAMEWORK_DIRECTIVE_BEFORE_YOU_START
      }),
    projectName: mockMarineLicenceData.projectName,
    navLinks: {
      continueHref:
        marineLicenceRoutes.MARINE_LICENCE_WATER_FRAMEWORK_DIRECTIVE_BEFORE_YOU_START,
      backHref: marineLicenceRoutes.MARINE_LICENCE_TASK_LIST
    }
  })
})
