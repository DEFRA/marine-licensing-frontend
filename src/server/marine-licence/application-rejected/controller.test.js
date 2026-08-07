import { vi } from 'vitest'
import Boom from '@hapi/boom'
import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'
import {
  applicationRejectedController,
  APPLICATION_REJECTED_VIEW_ROUTE
} from '#src/server/marine-licence/application-rejected/controller.js'
import { getMarineLicenceService } from '#src/services/marine-licence-service/index.js'
import { mockRejectedMarineLicenceApplication } from '#src/server/test-helpers/mocks/marine-licence-mocks.js'

vi.mock('#src/services/marine-licence-service/index.js')

const expectedViewOutput = {
  pageTitle: 'We are unable to progress your application',
  heading: 'We are unable to progress your application',
  marineLicenceId: mockRejectedMarineLicenceApplication.id,
  projectName: mockRejectedMarineLicenceApplication.projectName,
  applicationReference:
    mockRejectedMarineLicenceApplication.applicationReference,
  rejectedReasons: ['Site location', 'Water Framework Directive'],
  rejectedInformation: mockRejectedMarineLicenceApplication.rejectedInformation,
  viewDetailsUrl: `${marineLicenceRoutes.MARINE_LICENCE_VIEW_DETAILS}/${mockRejectedMarineLicenceApplication.id}`,
  updateAndResubmitUrl: `${marineLicenceRoutes.MARINE_LICENCE_UPDATE_AND_RESUBMIT}/${mockRejectedMarineLicenceApplication.id}`
}

describe('#applicationRejected', () => {
  let mockMarineLicenceService

  beforeEach(() => {
    mockMarineLicenceService = {
      getMarineLicenceById: vi
        .fn()
        .mockResolvedValue(mockRejectedMarineLicenceApplication)
    }
    vi.mocked(getMarineLicenceService).mockReturnValue(mockMarineLicenceService)
  })

  describe('#applicationRejectedController', () => {
    test('should render view with data from the service', async () => {
      const request = {
        params: { marineLicenceId: mockRejectedMarineLicenceApplication.id },
        logger: { error: vi.fn() }
      }
      const h = { view: vi.fn() }

      await applicationRejectedController.handler(request, h)

      expect(getMarineLicenceService).toHaveBeenCalledWith(request)
      expect(
        mockMarineLicenceService.getMarineLicenceById
      ).toHaveBeenCalledWith(mockRejectedMarineLicenceApplication.id)
      expect(h.view).toHaveBeenCalledWith(
        APPLICATION_REJECTED_VIEW_ROUTE,
        expectedViewOutput
      )
    })

    test('leaves rejectedReasons unset when not present', async () => {
      const mockRejectedMarineLicenceApplicationWithoutRejectedReasons = {
        ...mockRejectedMarineLicenceApplication
      }
      delete mockRejectedMarineLicenceApplicationWithoutRejectedReasons.rejectedReasons

      mockMarineLicenceService = {
        getMarineLicenceById: vi
          .fn()
          .mockResolvedValueOnce(
            mockRejectedMarineLicenceApplicationWithoutRejectedReasons
          )
      }

      vi.mocked(getMarineLicenceService).mockReturnValue(
        mockMarineLicenceService
      )

      const request = {
        params: { marineLicenceId: mockRejectedMarineLicenceApplication.id },
        logger: { error: vi.fn() }
      }
      const h = { view: vi.fn() }

      await applicationRejectedController.handler(request, h)

      expect(h.view).toHaveBeenCalledWith(APPLICATION_REJECTED_VIEW_ROUTE, {
        ...expectedViewOutput,
        rejectedReasons: undefined
      })
    })

    test('should propagate Boom errors from the service', async () => {
      mockMarineLicenceService.getMarineLicenceById.mockRejectedValue(
        Boom.notFound('Not found')
      )

      const request = {
        params: { marineLicenceId: mockRejectedMarineLicenceApplication.id },
        logger: { error: vi.fn() }
      }
      const h = { view: vi.fn() }

      await expect(
        applicationRejectedController.handler(request, h)
      ).rejects.toMatchObject({
        isBoom: true,
        output: { statusCode: 404 }
      })
    })

    test('should throw internal error for unexpected failures', async () => {
      const error = new Error('Unexpected failure')
      mockMarineLicenceService.getMarineLicenceById.mockRejectedValue(error)

      const request = {
        params: { marineLicenceId: mockRejectedMarineLicenceApplication.id },
        logger: { error: vi.fn() }
      }
      const h = { view: vi.fn() }

      await expect(
        applicationRejectedController.handler(request, h)
      ).rejects.toMatchObject({
        isBoom: true,
        output: { statusCode: 500 }
      })
      expect(request.logger.error).toHaveBeenCalledWith(
        error,
        'Error displaying application rejected page'
      )
    })
  })
})
