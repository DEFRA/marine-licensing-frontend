import { vi } from 'vitest'
import Boom from '@hapi/boom'
import {
  apiRoutes,
  marineLicenceRoutes,
  routes
} from '#src/server/common/constants/routes.js'
import {
  updateAndResubmitController,
  updateAndResubmitSubmitController,
  UPDATE_AND_RESUBMIT_VIEW_ROUTE
} from '#src/server/marine-licence/update-and-resubmit/controller.js'
import { getMarineLicenceService } from '#src/services/marine-licence-service/index.js'
import { authenticatedPostRequest } from '#src/server/common/helpers/authenticated-requests.js'
import { clearMarineLicenceCache } from '#src/server/common/helpers/marine-licence/session-cache/utils.js'
import { mockRejectedMarineLicenceApplication } from '#src/server/test-helpers/mocks/marine-licence-mocks.js'
import { PROJECT_STATUS } from '#src/server/common/constants/projects.js'

vi.mock('#src/services/marine-licence-service/index.js')
vi.mock('#src/server/common/helpers/authenticated-requests.js')
vi.mock('#src/server/common/helpers/marine-licence/session-cache/utils.js')

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
    test('should copy the marine licence, clear the cache and redirect to the new task list', async () => {
      const request = {
        params: { marineLicenceId: mockLicence.id },
        logger: { error: vi.fn() }
      }
      const h = { redirect: vi.fn() }

      vi.mocked(authenticatedPostRequest).mockResolvedValue({
        payload: { value: { id: 'new-marine-licence-id' } }
      })

      await updateAndResubmitSubmitController.handler(request, h)

      expect(authenticatedPostRequest).toHaveBeenCalledWith(
        request,
        apiRoutes.COPY_MARINE_LICENCE,
        { id: mockLicence.id }
      )
      expect(clearMarineLicenceCache).toHaveBeenCalledWith(request, h)
      expect(h.redirect).toHaveBeenCalledWith(
        `${marineLicenceRoutes.MARINE_LICENCE_TASK_LIST}/new-marine-licence-id`
      )
    })

    test('should redirect to the dashboard if the copy request fails', async () => {
      const request = {
        params: { marineLicenceId: mockLicence.id },
        logger: { error: vi.fn() }
      }
      const h = { redirect: vi.fn() }
      const error = new Error('Copy failed')

      vi.mocked(authenticatedPostRequest).mockRejectedValue(error)

      await updateAndResubmitSubmitController.handler(request, h)

      expect(request.logger.error).toHaveBeenCalledWith(
        error,
        'Error copying marine licence'
      )
      expect(clearMarineLicenceCache).not.toHaveBeenCalled()
      expect(h.redirect).toHaveBeenCalledWith(routes.DASHBOARD)
    })
  })
})
