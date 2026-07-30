import { vi } from 'vitest'
import Boom from '@hapi/boom'
import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'
import {
  applicationTransferredController,
  APPLICATION_TRANSFERRED_VIEW_ROUTE,
  CONTACT_EMAIL,
  CONTACT_PHONE
} from '#src/server/marine-licence/application-transferred/controller.js'
import { MCMS_LOGIN_URL } from '#src/server/common/constants/mcms.js'
import { getMarineLicenceService } from '#src/services/marine-licence-service/index.js'
import { mockSubmittedMarineLicenceApplication } from '#src/server/test-helpers/mocks/marine-licence-mocks.js'

vi.mock('#src/services/marine-licence-service/index.js')

describe('#applicationTransferred', () => {
  const mockLicence = mockSubmittedMarineLicenceApplication

  let mockMarineLicenceService

  beforeEach(() => {
    mockMarineLicenceService = {
      getMarineLicenceById: vi.fn().mockResolvedValue(mockLicence)
    }
    vi.mocked(getMarineLicenceService).mockReturnValue(mockMarineLicenceService)
  })

  describe('#applicationTransferredController', () => {
    test('should render view with data from the service', async () => {
      const request = {
        params: { marineLicenceId: mockLicence.id },
        logger: { error: vi.fn() }
      }
      const h = { view: vi.fn() }

      await applicationTransferredController.handler(request, h)

      expect(getMarineLicenceService).toHaveBeenCalledWith(request)
      expect(
        mockMarineLicenceService.getMarineLicenceById
      ).toHaveBeenCalledWith(mockLicence.id)
      expect(h.view).toHaveBeenCalledWith(APPLICATION_TRANSFERRED_VIEW_ROUTE, {
        pageTitle: 'Your application has been transferred',
        heading: 'Your application has been transferred',
        projectName: mockLicence.projectName,
        applicationReference: mockLicence.applicationReference,
        viewDetailsUrl: `${marineLicenceRoutes.MARINE_LICENCE_VIEW_DETAILS}/${mockLicence.id}`,
        mcmsLoginUrl: MCMS_LOGIN_URL,
        contactEmail: CONTACT_EMAIL,
        contactPhone: CONTACT_PHONE
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
        applicationTransferredController.handler(request, h)
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
        applicationTransferredController.handler(request, h)
      ).rejects.toMatchObject({
        isBoom: true,
        output: { statusCode: 500 }
      })
      expect(request.logger.error).toHaveBeenCalledWith(
        error,
        'Error displaying application transferred page'
      )
    })
  })
})
