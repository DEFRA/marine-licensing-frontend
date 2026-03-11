import { vi } from 'vitest'
import Boom from '@hapi/boom'
import { setupTestServer } from '#tests/integration/shared/test-setup-helpers.js'
import { getMarineLicenceService } from '#src/services/marine-licence-service/index.js'
import { viewDetailsController, VIEW_DETAILS_VIEW_ROUTE } from './controller.js'
import { makeGetRequest } from '#src/server/test-helpers/server-requests.js'
import { errorMessages } from '#src/server/common/constants/error-messages.js'
import {
  routes,
  marineLicenceRoutes
} from '#src/server/common/constants/routes.js'
import { mockMarineLicenceApplication } from '#src/server/test-helpers/mocks/marine-licence-mocks.js'

vi.mock('~/src/services/marine-licence-service/index.js')

const createSubmittedMarineLicence = (overrides = {}) => ({
  ...mockMarineLicenceApplication,
  applicationReference: 'ML/2024/12345',
  status: 'Submitted',
  ...overrides
})

describe('marine-licence view details controller', () => {
  const getServer = setupTestServer()
  let mockMarineLicenceService

  beforeEach(() => {
    mockMarineLicenceService = {
      getMarineLicenceById: vi
        .fn()
        .mockResolvedValue(createSubmittedMarineLicence()),
      getPublicMarineLicenceById: vi
        .fn()
        .mockResolvedValue(createSubmittedMarineLicence())
    }

    vi.mocked(getMarineLicenceService).mockReturnValue(mockMarineLicenceService)
  })

  describe(`GET /marine-licence/view-details/{marineLicenceId}`, () => {
    describe('successful scenarios', () => {
      test('should return 200 for a valid submitted marine licence', async () => {
        const { statusCode } = await makeGetRequest({
          url: `/marine-licence/view-details/${mockMarineLicenceApplication.id}`,
          server: getServer()
        })

        expect(statusCode).toBe(200)
      })

      test('should call the service with the correct ID', async () => {
        await makeGetRequest({
          url: `/marine-licence/view-details/${mockMarineLicenceApplication.id}`,
          server: getServer()
        })

        expect(getMarineLicenceService).toHaveBeenCalledWith(expect.any(Object))
        expect(
          mockMarineLicenceService.getMarineLicenceById
        ).toHaveBeenCalledWith(mockMarineLicenceApplication.id)
      })
    })

    describe('error scenarios', () => {
      test('should return 404 when ID is missing from URL', async () => {
        const { statusCode } = await makeGetRequest({
          url: '/marine-licence/view-details/',
          server: getServer()
        })

        expect(statusCode).toBe(404)
      })

      test('should return 403 when marine licence is not viewable', async () => {
        mockMarineLicenceService.getMarineLicenceById.mockResolvedValue(
          createSubmittedMarineLicence({ status: 'Draft' })
        )

        const { statusCode } = await makeGetRequest({
          url: `/marine-licence/view-details/${mockMarineLicenceApplication.id}`,
          server: getServer()
        })

        expect(statusCode).toBe(403)
      })

      test('should return 500 when the service throws an unexpected error', async () => {
        mockMarineLicenceService.getMarineLicenceById.mockRejectedValue(
          new Error('Something went wrong')
        )

        const { statusCode } = await makeGetRequest({
          url: `/marine-licence/view-details/${mockMarineLicenceApplication.id}`,
          server: getServer()
        })

        expect(statusCode).toBe(500)
      })

      test('should propagate Boom errors from the service', async () => {
        mockMarineLicenceService.getMarineLicenceById.mockRejectedValue(
          Boom.forbidden('Forbidden')
        )

        const { statusCode } = await makeGetRequest({
          url: `/marine-licence/view-details/${mockMarineLicenceApplication.id}`,
          server: getServer()
        })

        expect(statusCode).toBe(403)
      })

      test('should propagate Boom notFound errors from the service', async () => {
        mockMarineLicenceService.getMarineLicenceById.mockRejectedValue(
          Boom.notFound('Not found')
        )

        const { statusCode } = await makeGetRequest({
          url: `/marine-licence/view-details/${mockMarineLicenceApplication.id}`,
          server: getServer()
        })

        expect(statusCode).toBe(404)
      })
    })

    describe('controller unit tests', () => {
      test('should call view with correct data structure', async () => {
        const marineLicence = createSubmittedMarineLicence()
        const mockServiceInstance = {
          getMarineLicenceById: vi.fn().mockResolvedValue(marineLicence)
        }

        vi.mocked(getMarineLicenceService).mockReturnValue(mockServiceInstance)

        const mockRequest = {
          path: `${marineLicenceRoutes.MARINE_LICENCE_VIEW_DETAILS}/${mockMarineLicenceApplication.id}`,
          params: { marineLicenceId: mockMarineLicenceApplication.id },
          logger: { error: vi.fn() }
        }
        const mockH = { view: vi.fn() }

        await viewDetailsController.handler(mockRequest, mockH)

        expect(mockH.view).toHaveBeenCalledWith(
          VIEW_DETAILS_VIEW_ROUTE,
          expect.objectContaining({
            pageTitle: marineLicence.projectName,
            pageCaption: `${marineLicence.applicationReference} - Marine licence`,
            backLink: routes.DASHBOARD
          })
        )
      })

      test('should log and throw 403 when marine licence is in Draft status', async () => {
        const draftMarineLicence = createSubmittedMarineLicence({
          status: 'Draft'
        })
        const mockServiceInstance = {
          getMarineLicenceById: vi.fn().mockResolvedValue(draftMarineLicence)
        }

        vi.mocked(getMarineLicenceService).mockReturnValue(mockServiceInstance)

        const mockRequest = {
          path: `${marineLicenceRoutes.MARINE_LICENCE_VIEW_DETAILS}/${mockMarineLicenceApplication.id}`,
          params: { marineLicenceId: mockMarineLicenceApplication.id },
          logger: { error: vi.fn() }
        }
        const mockH = { view: vi.fn() }

        await expect(
          viewDetailsController.handler(mockRequest, mockH)
        ).rejects.toMatchObject({ isBoom: true, output: { statusCode: 403 } })

        expect(mockRequest.logger.error).toHaveBeenCalledWith(
          expect.objectContaining({
            id: mockMarineLicenceApplication.id,
            status: 'Draft'
          }),
          errorMessages.MARINE_LICENCE_NOT_SUBMITTED
        )
      })

      test('should log and throw 500 for unexpected errors', async () => {
        const mockServiceInstance = {
          getMarineLicenceById: vi
            .fn()
            .mockRejectedValue(new Error('Unexpected'))
        }

        vi.mocked(getMarineLicenceService).mockReturnValue(mockServiceInstance)

        const mockRequest = {
          path: `${marineLicenceRoutes.MARINE_LICENCE_VIEW_DETAILS}/${mockMarineLicenceApplication.id}`,
          params: { marineLicenceId: mockMarineLicenceApplication.id },
          logger: { error: vi.fn() }
        }
        const mockH = { view: vi.fn() }

        await expect(
          viewDetailsController.handler(mockRequest, mockH)
        ).rejects.toMatchObject({ isBoom: true, output: { statusCode: 500 } })

        expect(mockRequest.logger.error).toHaveBeenCalledWith(
          expect.any(Error),
          'Error displaying marine licence details'
        )
      })
    })
  })

  describe(`GET /marine-licence/view-public-details/{marineLicenceId}`, () => {
    describe('successful scenarios', () => {
      test('should return 200 for a valid submitted marine licence', async () => {
        const { statusCode } = await makeGetRequest({
          url: `/marine-licence/view-public-details/${mockMarineLicenceApplication.id}`,
          server: getServer()
        })

        expect(statusCode).toBe(200)
      })

      test('should call getPublicMarineLicenceById not getMarineLicenceById', async () => {
        await makeGetRequest({
          url: `/marine-licence/view-public-details/${mockMarineLicenceApplication.id}`,
          server: getServer()
        })

        expect(
          mockMarineLicenceService.getPublicMarineLicenceById
        ).toHaveBeenCalledWith(mockMarineLicenceApplication.id)
        expect(
          mockMarineLicenceService.getMarineLicenceById
        ).not.toHaveBeenCalled()
      })
    })

    describe('controller unit tests', () => {
      test('should call view with backLink null and short pageCaption for public view', async () => {
        const marineLicence = createSubmittedMarineLicence()
        const mockServiceInstance = {
          getPublicMarineLicenceById: vi.fn().mockResolvedValue(marineLicence)
        }

        vi.mocked(getMarineLicenceService).mockReturnValue(mockServiceInstance)

        const mockRequest = {
          path: `${marineLicenceRoutes.MARINE_LICENCE_VIEW_DETAILS_PUBLIC}/${mockMarineLicenceApplication.id}`,
          params: { marineLicenceId: mockMarineLicenceApplication.id },
          logger: { error: vi.fn() }
        }
        const mockH = { view: vi.fn() }

        await viewDetailsController.handler(mockRequest, mockH)

        expect(
          mockServiceInstance.getPublicMarineLicenceById
        ).toHaveBeenCalledWith(mockMarineLicenceApplication.id)
        expect(mockH.view).toHaveBeenCalledWith(
          VIEW_DETAILS_VIEW_ROUTE,
          expect.objectContaining({
            pageTitle: marineLicence.projectName,
            pageCaption: marineLicence.applicationReference,
            backLink: null
          })
        )
      })
    })

    describe('error scenarios', () => {
      test('should propagate 403 when public endpoint returns forbidden', async () => {
        mockMarineLicenceService.getPublicMarineLicenceById.mockRejectedValue(
          Boom.forbidden('Forbidden')
        )

        const { statusCode } = await makeGetRequest({
          url: `/marine-licence/view-public-details/${mockMarineLicenceApplication.id}`,
          server: getServer()
        })

        expect(statusCode).toBe(403)
      })
    })
  })
})
