import { marineLicenceRoutes } from '~/src/server/common/constants/routes.js'
import {
  mockMarineLicence,
  setupTestServer
} from '#tests/integration/shared/test-setup-helpers.js'
import {
  makeGetRequest,
  makePostRequest
} from '~/src/server/test-helpers/server-requests.js'
import { sharedChooseFileTypeTests } from './choose-file-type-tests.js'
import { mockMarineLicenceApplication } from '#src/server/test-helpers/mocks/marine-licence-mocks.js'

describe('Choose file type page (marine licence)', () => {
  const getServer = setupTestServer()

  beforeEach(() => {
    mockMarineLicence(mockMarineLicenceApplication)
  })

  sharedChooseFileTypeTests({
    getRequest: () =>
      makeGetRequest({
        server: getServer(),
        url: marineLicenceRoutes.MARINE_LICENCE_CHOOSE_FILE_UPLOAD_TYPE
      }),
    postRequest: ({ formData }) =>
      makePostRequest({
        server: getServer(),
        url: marineLicenceRoutes.MARINE_LICENCE_CHOOSE_FILE_UPLOAD_TYPE,
        formData
      }),
    projectName: mockMarineLicenceApplication.projectName,
    backHref: marineLicenceRoutes.MARINE_LICENCE_COORDINATES_TYPE_CHOICE,
    cancelHref: `${marineLicenceRoutes.MARINE_LICENCE_TASK_LIST}?cancel=site-details`
  })
})
