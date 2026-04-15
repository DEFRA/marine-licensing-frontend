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
import { sharedCoordinatesEntryTests } from './coordinates-entry-tests.js'

describe('Coordinates entry page (marine licence)', () => {
  const mockMarineLicenceData = {
    id: 'test-marine-licence-123',
    projectName: 'Test Marine Project',
    siteDetails: [{ coordinatesEntry: 'single' }]
  }

  const getServer = setupTestServer()

  beforeEach(() => {
    mockMarineLicence(mockMarineLicenceData)
  })

  sharedCoordinatesEntryTests({
    getRequest: () =>
      makeGetRequest({
        server: getServer(),
        url: marineLicenceRoutes.MARINE_LICENCE_COORDINATES_ENTRY_CHOICE
      }),
    postRequest: ({ formData }) =>
      makePostRequest({
        server: getServer(),
        url: marineLicenceRoutes.MARINE_LICENCE_COORDINATES_ENTRY_CHOICE,
        formData
      }),
    projectName: mockMarineLicenceData.projectName,
    backHref: marineLicenceRoutes.MARINE_LICENCE_SITE_NAME,
    cancelHref: `${marineLicenceRoutes.MARINE_LICENCE_TASK_LIST}?cancel=site-details`
  })

  test('should redirect to self when single is selected', async () => {
    const response = await makePostRequest({
      server: getServer(),
      url: marineLicenceRoutes.MARINE_LICENCE_COORDINATES_ENTRY_CHOICE,
      formData: { coordinatesEntry: 'single' }
    })

    expect(response.statusCode).toBe(statusCodes.redirect)
    expect(response.headers.location).toBe(
      marineLicenceRoutes.MARINE_LICENCE_COORDINATES_ENTRY_CHOICE
    )
  })

  test('should redirect to self when multiple is selected', async () => {
    const response = await makePostRequest({
      server: getServer(),
      url: marineLicenceRoutes.MARINE_LICENCE_COORDINATES_ENTRY_CHOICE,
      formData: { coordinatesEntry: 'multiple' }
    })

    expect(response.statusCode).toBe(statusCodes.redirect)
    expect(response.headers.location).toBe(
      marineLicenceRoutes.MARINE_LICENCE_COORDINATES_ENTRY_CHOICE
    )
  })
})
