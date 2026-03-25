import { routes } from '~/src/server/common/constants/routes.js'
import {
  mockExemption,
  setupTestServer
} from '#tests/integration/shared/test-setup-helpers.js'
import {
  makeGetRequest,
  makePostRequest
} from '~/src/server/test-helpers/server-requests.js'
import { sharedChooseFileTypeTests } from './choose-file-type-tests.js'
import { mockExemption as mockExemptionData } from '#src/server/test-helpers/mocks/exemption.js'

describe('Choose file type page (exemption)', () => {
  const getServer = setupTestServer()

  beforeEach(() => {
    mockExemption(mockExemptionData)
  })

  sharedChooseFileTypeTests({
    getRequest: () =>
      makeGetRequest({
        server: getServer(),
        url: routes.CHOOSE_FILE_UPLOAD_TYPE
      }),
    postRequest: ({ formData }) =>
      makePostRequest({
        server: getServer(),
        url: routes.CHOOSE_FILE_UPLOAD_TYPE,
        formData
      }),
    projectName: mockExemptionData.projectName,
    backHref: routes.COORDINATES_TYPE_CHOICE,
    cancelHref: '/exemption/task-list?cancel=site-details'
  })
})
