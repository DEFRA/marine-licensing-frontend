import { vi } from 'vitest'
import {
  publicConsultationSubmitController,
  PUBLIC_CONSULTATION_VIEW_ROUTE
} from '#src/server/marine-licence/public-consultation/controller.js'
import * as cacheUtils from '#src/server/common/helpers/marine-licence/session-cache/utils.js'
import * as authRequests from '#src/server/common/helpers/authenticated-requests.js'
import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'

vi.mock('#/src/server/common/helpers/marine-licence/session-cache/utils.js')

describe('#publicConsultation', () => {
  const mockLicence = {
    projectName: 'Test Project',
    id: 'test-id',
    publicConsultation: { consulted: 'yes', details: 'Some details' }
  }

  beforeEach(() => {
    vi.spyOn(authRequests, 'authenticatedPatchRequest').mockResolvedValue({
      payload: {
        id: mockLicence.id,
        ...mockLicence.publicConsultation
      }
    })
    vi.spyOn(cacheUtils, 'getMarineLicenceCache').mockReturnValue(mockLicence)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('#publicConsultationSubmitController', () => {
    test('Should pass error to global catchAll behaviour if it contains no validation data', async () => {
      const thrownError = { res: { statusCode: 500 }, data: {} }
      vi.spyOn(authRequests, 'authenticatedPatchRequest').mockRejectedValueOnce(
        thrownError
      )
      const h = {
        redirect: vi.fn().mockReturnValue({ takeover: vi.fn() }),
        view: vi.fn()
      }

      await expect(
        publicConsultationSubmitController.handler(
          {
            payload: { consulted: 'yes', details: 'Some details' },
            query: {}
          },
          h
        )
      ).rejects.toBe(thrownError)
      expect(h.view).not.toHaveBeenCalled()
      expect(h.redirect).not.toHaveBeenCalled()
    })

    test.each([
      {
        name: 'task list backlink',
        query: {},
        expectedBackLink: marineLicenceRoutes.MARINE_LICENCE_TASK_LIST
      },
      {
        name: 'check-your-answers backlink',
        query: { from: 'check-your-answers' },
        expectedBackLink: marineLicenceRoutes.MARINE_LICENCE_CHECK_YOUR_ANSWERS
      }
    ])(
      'Should handle API validation errors in catch block with $name',
      async ({ query, expectedBackLink }) => {
        vi.spyOn(
          authRequests,
          'authenticatedPatchRequest'
        ).mockRejectedValueOnce({
          data: {
            payload: {
              validation: {
                details: [
                  {
                    path: ['consulted'],
                    message: 'PUBLIC_CONSULTATION_REQUIRED',
                    type: 'any.required'
                  }
                ]
              }
            }
          }
        })

        const h = {
          redirect: vi.fn().mockReturnValue({ takeover: vi.fn() }),
          view: vi.fn()
        }

        await publicConsultationSubmitController.handler(
          {
            payload: { consulted: 'yes', details: 'Some details' },
            query
          },
          h
        )

        expect(h.view).toHaveBeenCalledWith(
          PUBLIC_CONSULTATION_VIEW_ROUTE,
          expect.objectContaining({
            backLink: expectedBackLink,
            payload: { consulted: 'yes', details: 'Some details' }
          })
        )
      }
    )
  })
})
