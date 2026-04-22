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
import { sharedCoordinateSystemTests } from './coordinate-system-tests.js'

describe('Coordinate system page (exemption)', () => {
  const mockExemptionData = {
    id: 'test-exemption-123',
    projectName: 'Test Project',
    siteDetails: [{ coordinatesEntry: 'single', coordinateSystem: 'wgs84' }]
  }

  const getServer = setupTestServer()

  beforeEach(() => {
    mockExemption(mockExemptionData)
  })

  sharedCoordinateSystemTests({
    getRequest: () =>
      makeGetRequest({
        server: getServer(),
        url: routes.COORDINATE_SYSTEM_CHOICE
      }),
    postRequest: ({ formData }) =>
      makePostRequest({
        server: getServer(),
        url: routes.COORDINATE_SYSTEM_CHOICE,
        formData
      }),
    projectName: mockExemptionData.projectName,
    backHref: routes.COORDINATES_ENTRY_CHOICE,
    cancelHref: `${routes.TASK_LIST}?cancel=site-details`
  })

  test('should redirect to circle centre point when wgs84 is selected and coordinatesEntry is single', async () => {
    const response = await makePostRequest({
      server: getServer(),
      url: routes.COORDINATE_SYSTEM_CHOICE,
      formData: { coordinateSystem: 'wgs84' }
    })

    expect(response.statusCode).toBe(statusCodes.redirect)
    expect(response.headers.location).toBe(routes.CIRCLE_CENTRE_POINT)
  })

  test('should redirect to circle centre point when osgb36 is selected and coordinatesEntry is single', async () => {
    const response = await makePostRequest({
      server: getServer(),
      url: routes.COORDINATE_SYSTEM_CHOICE,
      formData: { coordinateSystem: 'osgb36' }
    })

    expect(response.statusCode).toBe(statusCodes.redirect)
    expect(response.headers.location).toBe(routes.CIRCLE_CENTRE_POINT)
  })
})
