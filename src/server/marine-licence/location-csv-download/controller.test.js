import Boom from '@hapi/boom'
import { vi } from 'vitest'
import { setupTestServer } from '#tests/integration/shared/test-setup-helpers.js'
import { authenticatedGetRequest } from '#src/server/common/helpers/authenticated-requests.js'
import { locationCsvDownloadController } from './controller.js'
import { makeGetRequest } from '#src/server/test-helpers/server-requests.js'
import { mockMarineLicenceApplication } from '#src/server/test-helpers/mocks/marine-licence-mocks.js'
import {
  apiRoutes,
  marineLicenceRoutes
} from '#src/server/common/constants/routes.js'
import {
  createMockH,
  createMockRequest
} from '#src/server/test-helpers/mocks/helpers.js'

vi.mock('~/src/server/common/helpers/authenticated-requests.js')

const { id: marineLicenceId } = mockMarineLicenceApplication
const TEST_ID = 'test-marine-licence-id'

const csvPayload = Buffer.from('site,lat,lng\nSite A,50.9876,-1.2345\n')

const mockCsvResponse = (overrides = {}) => ({
  res: {
    statusCode: 200,
    headers: {},
    ...overrides.res
  },
  payload: csvPayload,
  ...overrides
})

const createCsvMockH = () => {
  const h = createMockH()
  h.response = vi.fn().mockImplementation(() => h)
  h.type = vi.fn().mockImplementation(() => h)
  h.header = vi.fn().mockImplementation(() => h)
  return h
}

describe('locationCSVDownload controller', () => {
  const getServer = setupTestServer()

  beforeEach(() => {
    vi.mocked(authenticatedGetRequest).mockResolvedValue(mockCsvResponse())
  })

  describe(`GET ${marineLicenceRoutes.MARINE_LICENCE_CSV_DOWNLOAD}/{marineLicenceId}`, () => {
    describe('successful scenarios', () => {
      test('should return 200 with CSV content type and call backend with correct endpoint', async () => {
        const { statusCode, headers } = await makeGetRequest({
          url: `${marineLicenceRoutes.MARINE_LICENCE_CSV_DOWNLOAD}/${marineLicenceId}`,
          server: getServer()
        })

        expect(statusCode).toBe(200)
        expect(headers['content-type']).toContain('text/csv')
        expect(authenticatedGetRequest).toHaveBeenCalledWith(
          expect.any(Object),
          apiRoutes.GENERATE_COORDINATES_CSV.replace(
            '{marineLicenceId}',
            marineLicenceId
          ),
          { json: false }
        )
      })
    })

    describe('error scenarios', () => {
      test('should return 404 when marineLicenceId is missing from URL', async () => {
        const { statusCode } = await makeGetRequest({
          url: `${marineLicenceRoutes.MARINE_LICENCE_CSV_DOWNLOAD}/`,
          server: getServer()
        })

        expect(statusCode).toBe(404)
      })

      test('should wrap non-Boom errors from authenticatedGetRequest in Boom.internal and log them', async () => {
        const networkError = new Error('Network failure')
        vi.mocked(authenticatedGetRequest).mockRejectedValue(networkError)

        const request = createMockRequest({
          params: { marineLicenceId: TEST_ID }
        })
        const h = createCsvMockH()

        await expect(
          locationCsvDownloadController.handler(request, h)
        ).rejects.toMatchObject({ isBoom: true, output: { statusCode: 500 } })

        expect(request.logger.error).toHaveBeenCalledWith(
          networkError,
          'Error downloading coordinates CSV'
        )
      })

      test('should re-throw Boom errors from authenticatedGetRequest without wrapping', async () => {
        const boomError = Boom.forbidden('Not allowed')
        vi.mocked(authenticatedGetRequest).mockRejectedValue(boomError)

        const request = createMockRequest({
          params: { marineLicenceId: TEST_ID }
        })
        const h = createCsvMockH()

        await expect(
          locationCsvDownloadController.handler(request, h)
        ).rejects.toBe(boomError)
      })

      test('should throw Boom.internal when backend returns a non-200 status', async () => {
        vi.mocked(authenticatedGetRequest).mockResolvedValue(
          mockCsvResponse({ res: { statusCode: 502, headers: {} } })
        )

        const request = createMockRequest({
          params: { marineLicenceId: TEST_ID }
        })
        const h = createCsvMockH()

        await expect(
          locationCsvDownloadController.handler(request, h)
        ).rejects.toMatchObject({ isBoom: true, output: { statusCode: 500 } })

        expect(request.logger.error).toHaveBeenCalledWith(
          expect.objectContaining({
            marineLicenceId: TEST_ID,
            statusCode: 502
          }),
          'Unexpected status code from CSV download endpoint'
        )
      })
    })
  })
})
