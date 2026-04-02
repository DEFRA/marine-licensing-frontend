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
import { sharedCoordinatesTypeTests } from './coordinates-type-tests.js'

describe('Coordinates type page (marine licence)', () => {
  const mockMarineLicenceData = {
    id: 'test-marine-licence-123',
    projectName: 'Test Marine Project'
  }

  const getServer = setupTestServer()

  beforeEach(() => {
    mockMarineLicence(mockMarineLicenceData)
  })

  sharedCoordinatesTypeTests({
    getRequest: () =>
      makeGetRequest({
        server: getServer(),
        url: marineLicenceRoutes.MARINE_LICENCE_COORDINATES_TYPE_CHOICE
      }),
    postRequest: ({ formData }) =>
      makePostRequest({
        server: getServer(),
        url: marineLicenceRoutes.MARINE_LICENCE_COORDINATES_TYPE_CHOICE,
        formData
      }),
    projectName: mockMarineLicenceData.projectName,
    backHref: marineLicenceRoutes.MARINE_LICENCE_SITE_DETAILS,
    cancelHref: `${marineLicenceRoutes.MARINE_LICENCE_TASK_LIST}?cancel=site-details`
  })

  test('should redirect to choose file type when file option is selected', async () => {
    const response = await makePostRequest({
      server: getServer(),
      url: marineLicenceRoutes.MARINE_LICENCE_COORDINATES_TYPE_CHOICE,
      formData: { coordinatesType: 'file' }
    })

    expect(response.statusCode).toBe(statusCodes.redirect)
    expect(response.headers.location).toBe(
      marineLicenceRoutes.MARINE_LICENCE_CHOOSE_FILE_UPLOAD_TYPE
    )
  })

  test('should redirect to same page when coordinates option is selected', async () => {
    const response = await makePostRequest({
      server: getServer(),
      url: marineLicenceRoutes.MARINE_LICENCE_COORDINATES_TYPE_CHOICE,
      formData: { coordinatesType: 'coordinates' }
    })

    expect(response.statusCode).toBe(statusCodes.redirect)
    expect(response.headers.location).toBe(
      marineLicenceRoutes.MARINE_LICENCE_SITE_NAME
    )
  })
})
