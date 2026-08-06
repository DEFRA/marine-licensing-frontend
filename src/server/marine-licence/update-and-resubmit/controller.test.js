import { vi } from 'vitest'
import Boom from '@hapi/boom'
import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'
import {
  updateAndResubmitController,
  updateAndResubmitSubmitController,
  UPDATE_AND_RESUBMIT_VIEW_ROUTE
} from '#src/server/marine-licence/update-and-resubmit/controller.js'
import { getMarineLicenceService } from '#src/services/marine-licence-service/index.js'
import { mockRejectedMarineLicenceApplication } from '#src/server/test-helpers/mocks/marine-licence-mocks.js'
import { PROJECT_STATUS } from '#src/server/common/constants/projects.js'

vi.mock('#src/services/marine-licence-service/index.js')

describe('#updateAndResubmit', () => {
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

  describe('#updateAndResubmitController', () => {
    test('should render view with data from the service', async () => {
      const request = {
        params: { marineLicenceId: mockLicence.id },
        logger: { error: vi.fn() }
      }
      const h = { view: vi.fn() }

      await updateAndResubmitController.handler(request, h)

      expect(getMarineLicenceService).toHaveBeenCalledWith(request)
      expect(
        mockMarineLicenceService.getMarineLicenceById
      ).toHaveBeenCalledWith(mockLicence.id)
      expect(h.view).toHaveBeenCalledWith(UPDATE_AND_RESUBMIT_VIEW_ROUTE, {
        pageTitle: 'Apply again for this project',
        heading: 'Apply again for this project',
        projectName: mockLicence.projectName,
        applicationReference: mockLicence.applicationReference,
        backLink: `${marineLicenceRoutes.MARINE_LICENCE_APPLICATION_REJECTED}/${mockLicence.id}`,
        cancelLink: `${marineLicenceRoutes.MARINE_LICENCE_APPLICATION_REJECTED}/${mockLicence.id}`
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
        updateAndResubmitController.handler(request, h)
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
        updateAndResubmitController.handler(request, h)
      ).rejects.toMatchObject({
        isBoom: true,
        output: { statusCode: 500 }
      })
      expect(request.logger.error).toHaveBeenCalledWith(
        error,
        'Error displaying update and resubmit page'
      )
    })
  })

  describe('#updateAndResubmitSubmitController', () => {
    test('should do nothing', async () => {
      const request = {
        params: { marineLicenceId: mockLicence.id }
      }
      const h = { response: vi.fn() }

      await updateAndResubmitSubmitController.handler(request, h)

      expect(h.response).toHaveBeenCalled()
      expect(getMarineLicenceService).not.toHaveBeenCalled()
    })
  })
})
