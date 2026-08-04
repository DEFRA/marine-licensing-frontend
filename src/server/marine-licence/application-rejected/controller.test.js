import { vi } from 'vitest'
import Boom from '@hapi/boom'
import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'
import {
  applicationRejectedController,
  applicationRejectedSubmitController,
  APPLICATION_REJECTED_VIEW_ROUTE
} from '#src/server/marine-licence/application-rejected/controller.js'
import { getMarineLicenceService } from '#src/services/marine-licence-service/index.js'
import { mockRejectedMarineLicenceApplication } from '#src/server/test-helpers/mocks/marine-licence-mocks.js'
import { PROJECT_STATUS } from '#src/server/common/constants/projects.js'

vi.mock('#src/services/marine-licence-service/index.js')

describe('#applicationRejected', () => {
  const mockLicence = {
    ...mockRejectedMarineLicenceApplication,
    status: PROJECT_STATUS.REJECTED
  }

  let mockMarineLicenceService

  beforeEach(() => {
    mockMarineLicenceService = {
      getMarineLicenceById: vi.fn().mockResolvedValue(mockLicence)
    }
    vi.mocked(getMarineLicenceService).mockReturnValue(mockMarineLicenceService)
  })

  describe('#applicationRejectedController', () => {
    test('should render view with data from the service', async () => {
      const request = {
        params: { marineLicenceId: mockLicence.id },
        logger: { error: vi.fn() }
      }
      const h = { view: vi.fn() }

      await applicationRejectedController.handler(request, h)

      expect(getMarineLicenceService).toHaveBeenCalledWith(request)
      expect(
        mockMarineLicenceService.getMarineLicenceById
      ).toHaveBeenCalledWith(mockLicence.id)
      expect(h.view).toHaveBeenCalledWith(APPLICATION_REJECTED_VIEW_ROUTE, {
        pageTitle: 'We are unable to progress your application',
        heading: 'We are unable to progress your application',
        projectName: mockLicence.projectName,
        applicationReference: mockLicence.applicationReference,
        rejectedReasons: ['Site location', 'Water Framework Directive'],
        rejectedInformation: mockLicence.rejectedInformation,
        viewDetailsUrl: `${marineLicenceRoutes.MARINE_LICENCE_VIEW_DETAILS}/${mockLicence.id}`
      })
    })

    test('should propagate Boom errors from the service', async () => {
      mockMarineLicenceService.getMarineLicenceById.mockRejectedValue(
        Boom.notFound('Not found')
      )

      const request = {
        params: { marineLicenceId: mockLicence.id },
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
        params: { marineLicenceId: mockLicence.id },
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

  describe('#applicationRejectedSubmitController', () => {
    test('should do nothing', async () => {
      const request = {
        params: { marineLicenceId: mockLicence.id }
      }
      const h = { response: vi.fn() }

      await applicationRejectedSubmitController.handler(request, h)

      expect(h.response).toHaveBeenCalled()
      expect(getMarineLicenceService).not.toHaveBeenCalled()
    })
  })
})
