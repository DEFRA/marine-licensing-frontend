import { statusCodes } from '~/src/server/common/constants/status-codes.js'
import { marineLicenceRoutes } from '~/src/server/common/constants/routes.js'
import {
  mockMarineLicence,
  setupTestServer
} from '#tests/integration/shared/test-setup-helpers.js'
import {
  makeGetRequest,
  makePostRequest
} from '~/src/server/test-helpers/server-requests.js'
import { sharedCoordinateSystemTests } from './coordinate-system-tests.js'

describe('Coordinate system page (marine licence)', () => {
  const mockMarineLicenceData = {
    id: 'test-marine-licence-123',
    projectName: 'Test Marine Project',
    siteDetails: [{ coordinateSystem: 'wgs84' }]
  }

  const getServer = setupTestServer()

  beforeEach(() => {
    mockMarineLicence(mockMarineLicenceData)
  })

  sharedCoordinateSystemTests({
    getRequest: () =>
      makeGetRequest({
        server: getServer(),
        url: marineLicenceRoutes.MARINE_LICENCE_COORDINATE_SYSTEM_CHOICE
      }),
    postRequest: ({ formData }) =>
      makePostRequest({
        server: getServer(),
        url: marineLicenceRoutes.MARINE_LICENCE_COORDINATE_SYSTEM_CHOICE,
        formData
      }),
    projectName: mockMarineLicenceData.projectName,
    backHref: marineLicenceRoutes.MARINE_LICENCE_COORDINATES_ENTRY_CHOICE,
    cancelHref: `${marineLicenceRoutes.MARINE_LICENCE_TASK_LIST}?cancel=site-details`
  })

  test('should redirect to self when wgs84 is selected', async () => {
    const response = await makePostRequest({
      server: getServer(),
      url: marineLicenceRoutes.MARINE_LICENCE_COORDINATE_SYSTEM_CHOICE,
      formData: { coordinateSystem: 'wgs84' }
    })

    expect(response.statusCode).toBe(statusCodes.redirect)
    expect(response.headers.location).toBe(
      marineLicenceRoutes.MARINE_LICENCE_CIRCLE_CENTRE_POINT
    )
  })

  test('should redirect to self when osgb36 is selected', async () => {
    const response = await makePostRequest({
      server: getServer(),
      url: marineLicenceRoutes.MARINE_LICENCE_COORDINATE_SYSTEM_CHOICE,
      formData: { coordinateSystem: 'osgb36' }
    })

    expect(response.statusCode).toBe(statusCodes.redirect)
    expect(response.headers.location).toBe(
      marineLicenceRoutes.MARINE_LICENCE_CIRCLE_CENTRE_POINT
    )
  })
})
