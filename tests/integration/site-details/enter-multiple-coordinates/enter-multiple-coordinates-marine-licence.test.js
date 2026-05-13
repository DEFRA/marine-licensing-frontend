import { vi } from 'vitest'
import { COORDINATE_SYSTEMS } from '~/src/server/common/constants/coordinate-systems.js'
import { marineLicenceRoutes } from '~/src/server/common/constants/routes.js'
import {
  makeGetRequest,
  makePostRequest
} from '~/src/server/test-helpers/server-requests.js'
import {
  mockMarineLicence,
  setupTestServer
} from '~/tests/integration/shared/test-setup-helpers.js'
import { mockMarineLicenceApplication } from '~/src/server/test-helpers/mocks/marine-licence-mocks.js'
import { updateMarineLicenceSiteDetails } from '~/src/server/common/helpers/marine-licence/session-cache/utils.js'
import { sharedEnterMultipleCoordinatesTests } from './enter-multiple-coordinates-tests.js'

vi.mock('~/src/server/common/helpers/marine-licence/session-cache/utils.js')

const wgs84Coordinates = [
  { latitude: '51.507400', longitude: '-0.127800' },
  { latitude: '51.517500', longitude: '-0.137600' },
  { latitude: '51.527600', longitude: '-0.147700' }
]

const osgb36Coordinates = [
  { easting: '530000', northing: '181000' },
  { easting: '530100', northing: '181100' },
  { easting: '530200', northing: '181200' }
]

const mockWgs84Application = {
  ...mockMarineLicenceApplication,
  siteDetails: [
    {
      coordinatesType: 'coordinates',
      coordinateSystem: COORDINATE_SYSTEMS.WGS84,
      coordinates: wgs84Coordinates
    }
  ]
}

const mockOsgb36Application = {
  ...mockMarineLicenceApplication,
  siteDetails: [
    {
      coordinatesType: 'coordinates',
      coordinateSystem: COORDINATE_SYSTEMS.OSGB36,
      coordinates: osgb36Coordinates
    }
  ]
}

const mockEmptyWgs84Application = {
  ...mockMarineLicenceApplication,
  siteDetails: [
    {
      coordinatesType: 'coordinates',
      coordinateSystem: COORDINATE_SYSTEMS.WGS84,
      coordinates: []
    }
  ]
}

describe('Enter multiple coordinates page (marine licence)', () => {
  const getServer = setupTestServer()

  beforeEach(() => {
    vi.mocked(updateMarineLicenceSiteDetails).mockResolvedValue(undefined)
  })

  sharedEnterMultipleCoordinatesTests({
    getRequest: () =>
      makeGetRequest({
        url: marineLicenceRoutes.MARINE_LICENCE_ENTER_MULTIPLE_COORDINATES,
        server: getServer()
      }),
    postRequest: (formData) =>
      makePostRequest({
        url: marineLicenceRoutes.MARINE_LICENCE_ENTER_MULTIPLE_COORDINATES,
        server: getServer(),
        formData
      }),
    projectName: mockWgs84Application.projectName,
    backHref: marineLicenceRoutes.MARINE_LICENCE_COORDINATE_SYSTEM_CHOICE,
    cancelHref: `${marineLicenceRoutes.MARINE_LICENCE_TASK_LIST}?cancel=site-details`,
    wgs84FirstCoord: wgs84Coordinates[0],
    osgb36FirstCoord: osgb36Coordinates[0],
    setupWgs84: () => mockMarineLicence(mockWgs84Application),
    setupOsgb36: () => mockMarineLicence(mockOsgb36Application),
    setupEmptyWgs84: () => mockMarineLicence(mockEmptyWgs84Application),
    redirectHref: marineLicenceRoutes.MARINE_LICENCE_ENTER_MULTIPLE_COORDINATES
  })
})
