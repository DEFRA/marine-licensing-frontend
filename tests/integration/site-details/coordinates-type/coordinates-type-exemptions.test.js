import { routes } from '~/src/server/common/constants/routes.js'
import {
  mockExemption,
  setupTestServer
} from '#tests/integration/shared/test-setup-helpers.js'
import {
  makeGetRequest,
  makePostRequest
} from '~/src/server/test-helpers/server-requests.js'
import { sharedCoordinatesTypeTests } from './coordinates-type-tests.js'

describe('Coordinates type page (exemption)', () => {
  const mockExemptionData = {
    id: 'test-exemption-123',
    projectName: 'Test Project',
    siteDetails: [{ coordinatesType: 'coordinates' }]
  }

  const getServer = setupTestServer()

  beforeEach(() => {
    mockExemption(mockExemptionData)
  })

  sharedCoordinatesTypeTests({
    getRequest: () =>
      makeGetRequest({
        server: getServer(),
        url: routes.COORDINATES_TYPE_CHOICE
      }),
    postRequest: ({ formData }) =>
      makePostRequest({
        server: getServer(),
        url: routes.COORDINATES_TYPE_CHOICE,
        formData
      }),
    projectName: mockExemptionData.projectName,
    backHref: routes.SITE_DETAILS,
    cancelHref: `${routes.TASK_LIST}?cancel=site-details`
  })
})
