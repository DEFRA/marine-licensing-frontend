import { statusCodes } from '~/src/server/common/constants/status-codes.js'
import { routes } from '~/src/server/common/constants/routes.js'
import {
  mockExemption,
  setupTestServer
} from '#tests/integration/shared/test-setup-helpers.js'
import {
  makeGetRequest,
  makePostRequest
} from '~/src/server/test-helpers/server-requests.js'
import { sharedCoordinatesEntryTests } from './coordinates-entry-tests.js'

describe('Coordinates entry page (exemption)', () => {
  const mockExemptionData = {
    id: 'test-exemption-123',
    projectName: 'Test Project',
    siteDetails: [{ coordinatesEntry: 'single' }]
  }

  const getServer = setupTestServer()

  beforeEach(() => {
    mockExemption(mockExemptionData)
  })

  sharedCoordinatesEntryTests({
    getRequest: () =>
      makeGetRequest({
        server: getServer(),
        url: routes.COORDINATES_ENTRY_CHOICE
      }),
    postRequest: ({ formData }) =>
      makePostRequest({
        server: getServer(),
        url: routes.COORDINATES_ENTRY_CHOICE,
        formData
      }),
    projectName: mockExemptionData.projectName,
    backHref: routes.ACTIVITY_DESCRIPTION,
    cancelHref: `${routes.TASK_LIST}?cancel=site-details`
  })

  test('should redirect to coordinate system choice when single is selected', async () => {
    const response = await makePostRequest({
      server: getServer(),
      url: routes.COORDINATES_ENTRY_CHOICE,
      formData: { coordinatesEntry: 'single' }
    })

    expect(response.statusCode).toBe(statusCodes.redirect)
    expect(response.headers.location).toBe(routes.COORDINATE_SYSTEM_CHOICE)
  })

  test('should redirect to coordinate system choice when multiple is selected', async () => {
    const response = await makePostRequest({
      server: getServer(),
      url: routes.COORDINATES_ENTRY_CHOICE,
      formData: { coordinatesEntry: 'multiple' }
    })

    expect(response.statusCode).toBe(statusCodes.redirect)
    expect(response.headers.location).toBe(routes.COORDINATE_SYSTEM_CHOICE)
  })
})
