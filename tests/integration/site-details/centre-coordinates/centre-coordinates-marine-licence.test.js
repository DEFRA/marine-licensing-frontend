import { vi } from 'vitest'
import { COORDINATE_SYSTEMS } from '~/src/server/common/constants/coordinate-systems.js'
import { marineLicenceRoutes } from '~/src/server/common/constants/routes.js'
import * as coordinateUtils from '~/src/server/common/helpers/coordinate-utils.js'
import {
  makeGetRequest,
  makePostRequest
} from '~/src/server/test-helpers/server-requests.js'
import {
  mockMarineLicence,
  setupTestServer
} from '~/tests/integration/shared/test-setup-helpers.js'
import { mockMarineLicenceApplication } from '~/src/server/test-helpers/mocks/marine-licence-mocks.js'
import { sharedCentreCoordinatesTests } from './centre-coordinates-tests.js'

vi.mock('~/src/server/common/helpers/coordinate-utils.js')
vi.mock('~/src/server/common/helpers/marine-licence/session-cache/utils.js')

const mockWgs84Data = {
  ...mockMarineLicenceApplication,
  siteDetails: [
    {
      coordinatesType: 'coordinates',
      coordinateSystem: COORDINATE_SYSTEMS.WGS84,
      coordinates: { latitude: '55.019889', longitude: '-1.399500' }
    }
  ]
}

const mockOsgb36Data = {
  ...mockMarineLicenceApplication,
  siteDetails: [
    {
      coordinatesType: 'coordinates',
      coordinateSystem: COORDINATE_SYSTEMS.OSGB36,
      coordinates: { eastings: '425053', northings: '564180' }
    }
  ]
}

describe('Centre coordinates page (marine licence)', () => {
  const getServer = setupTestServer()

  beforeEach(() => {
    mockMarineLicence(mockWgs84Data)
    vi.spyOn(coordinateUtils, 'getCoordinateSystem').mockReturnValue({
      coordinateSystem: COORDINATE_SYSTEMS.WGS84
    })
  })

  sharedCentreCoordinatesTests({
    getRequest: () =>
      makeGetRequest({
        url: marineLicenceRoutes.MARINE_LICENCE_CIRCLE_CENTRE_POINT,
        server: getServer()
      }),
    postRequest: ({ formData }) =>
      makePostRequest({
        url: marineLicenceRoutes.MARINE_LICENCE_CIRCLE_CENTRE_POINT,
        server: getServer(),
        formData
      }),
    projectName: mockWgs84Data.projectName,
    backHref: marineLicenceRoutes.MARINE_LICENCE_COORDINATE_SYSTEM_CHOICE,
    cancelHref: `${marineLicenceRoutes.MARINE_LICENCE_TASK_LIST}?cancel=site-details`,
    latitude: mockWgs84Data.siteDetails[0].coordinates.latitude,
    longitude: mockWgs84Data.siteDetails[0].coordinates.longitude,
    redirectHref: marineLicenceRoutes.MARINE_LICENCE_WIDTH_OF_SITE,
    setupOsgb36: () => {
      mockMarineLicence(mockOsgb36Data)
      vi.spyOn(coordinateUtils, 'getCoordinateSystem').mockReturnValueOnce({
        coordinateSystem: COORDINATE_SYSTEMS.OSGB36
      })
    },
    eastings: mockOsgb36Data.siteDetails[0].coordinates.eastings,
    northings: mockOsgb36Data.siteDetails[0].coordinates.northings
  })
})
