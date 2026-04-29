import {
  makeGetRequest,
  makePostRequest
} from '~/src/server/test-helpers/server-requests.js'
import {
  mockExemption,
  setupTestServer
} from '~/tests/integration/shared/test-setup-helpers.js'
import { routes } from '~/src/server/common/constants/routes.js'
import {
  exemptionWgs84Coordinates,
  exemptionOsgb36Coordinates,
  exemptionWgs84EmptyCoordinates,
  wgs84Coordinates,
  osgb36Coordinates
} from './fixtures.js'
import { sharedEnterMultipleCoordinatesTests } from './enter-multiple-coordinates-tests.js'

describe('Enter multiple coordinates page (exemptions)', () => {
  const getServer = setupTestServer()

  sharedEnterMultipleCoordinatesTests({
    getRequest: () =>
      makeGetRequest({
        url: routes.ENTER_MULTIPLE_COORDINATES,
        server: getServer()
      }),
    postRequest: (formData) =>
      makePostRequest({
        url: routes.ENTER_MULTIPLE_COORDINATES,
        server: getServer(),
        formData
      }),
    projectName: exemptionWgs84Coordinates.projectName,
    backHref: routes.COORDINATE_SYSTEM_CHOICE,
    cancelHref: `${routes.TASK_LIST}?cancel=site-details`,
    wgs84FirstCoord: wgs84Coordinates[0],
    osgb36FirstCoord: osgb36Coordinates[0],
    setupWgs84: () => mockExemption(exemptionWgs84Coordinates),
    setupOsgb36: () => mockExemption(exemptionOsgb36Coordinates),
    setupEmptyWgs84: () => mockExemption(exemptionWgs84EmptyCoordinates),
    redirectHref: routes.REVIEW_SITE_DETAILS
  })
})
