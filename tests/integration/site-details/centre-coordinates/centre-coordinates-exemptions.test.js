import { vi } from 'vitest'
import { COORDINATE_SYSTEMS } from '~/src/server/common/constants/coordinate-systems.js'
import { routes } from '~/src/server/common/constants/routes.js'
import * as coordinateUtils from '~/src/server/common/helpers/coordinate-utils.js'
import {
  makeGetRequest,
  makePostRequest
} from '~/src/server/test-helpers/server-requests.js'
import {
  mockExemption,
  setupTestServer
} from '~/tests/integration/shared/test-setup-helpers.js'
import { mockExemption as mockExemptionData } from '~/src/server/test-helpers/mocks/exemption.js'
import { sharedCentreCoordinatesTests } from './centre-coordinates-tests.js'

vi.mock('~/src/server/common/helpers/coordinate-utils.js')
vi.mock('~/src/server/common/helpers/exemptions/session-cache/utils.js')
vi.mock('~/src/server/common/helpers/exemptions/save-site-details.js')

const mockOsgb36ExemptionData = {
  ...mockExemptionData,
  siteDetails: [
    {
      coordinatesType: 'coordinates',
      coordinateSystem: COORDINATE_SYSTEMS.OSGB36,
      coordinates: { eastings: '532000', northings: '182000' }
    }
  ]
}

describe('Centre coordinates page (exemptions)', () => {
  const getServer = setupTestServer()

  beforeEach(() => {
    mockExemption(mockExemptionData)
    vi.spyOn(coordinateUtils, 'getCoordinateSystem').mockReturnValue({
      coordinateSystem: COORDINATE_SYSTEMS.WGS84
    })
  })

  sharedCentreCoordinatesTests({
    getRequest: () =>
      makeGetRequest({ url: routes.CIRCLE_CENTRE_POINT, server: getServer() }),
    postRequest: ({ formData }) =>
      makePostRequest({
        url: routes.CIRCLE_CENTRE_POINT,
        server: getServer(),
        formData
      }),
    projectName: mockExemptionData.projectName,
    backHref: routes.COORDINATE_SYSTEM_CHOICE,
    cancelHref: `${routes.TASK_LIST}?cancel=site-details`,
    latitude: mockExemptionData.siteDetails[0].coordinates.latitude,
    longitude: mockExemptionData.siteDetails[0].coordinates.longitude,
    redirectHref: routes.WIDTH_OF_SITE,
    setupOsgb36: () => {
      mockExemption(mockOsgb36ExemptionData)
      vi.spyOn(coordinateUtils, 'getCoordinateSystem').mockReturnValueOnce({
        coordinateSystem: COORDINATE_SYSTEMS.OSGB36
      })
    },
    eastings: '532000',
    northings: '182000'
  })
})
