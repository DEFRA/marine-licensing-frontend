import { vi } from 'vitest'
import {
  consultationResponseController,
  consultationResponseSubmitController,
  CONSULTATION_RESPONSE_VIEW_ROUTE
} from './controller.js'
import { fetchConsultation } from '#src/server/common/helpers/marine-licence/consultation/fetch-consultation.js'
import { authenticatedPatchRequest } from '#src/server/common/helpers/authenticated-requests.js'
import { apiRoutes, routes } from '#src/server/common/constants/routes.js'
import { CONSULTATION_STATUS_CODE } from '#src/server/common/constants/marine-licence.js'
import { mockMarineLicenceWithConsultationApplication } from '#src/server/test-helpers/mocks/marine-licence-mocks.js'

vi.mock(
  '~/src/server/common/helpers/marine-licence/consultation/fetch-consultation.js'
)
vi.mock('~/src/server/common/helpers/authenticated-requests.js')

describe('#consultation-response', () => {
  const { consultation } = mockMarineLicenceWithConsultationApplication
  const marineLicenceId = consultation.id
  const respondedConsultation = {
    ...consultation,
    consultationStatus: CONSULTATION_STATUS_CODE.RESPONDED
  }
  const consultationDetailsLink = `/marine-licence/consultation-details/${marineLicenceId}`
  const viewContext = {
    pageTitle: 'Your response',
    heading: 'Your response',
    projectName: consultation.projectName,
    backLink: consultationDetailsLink
  }

  beforeEach(() => {
    vi.mocked(fetchConsultation).mockResolvedValue(consultation)
  })

  describe('#consultationResponseController', () => {
    test('Should fetch the consultation and render the template', async () => {
      const request = { params: { marineLicenceId } }
      const h = { view: vi.fn() }

      await consultationResponseController.handler(request, h)

      expect(fetchConsultation).toHaveBeenCalledWith(request, marineLicenceId)
      expect(h.view).toHaveBeenCalledWith(
        CONSULTATION_RESPONSE_VIEW_ROUTE,
        viewContext
      )
    })

    test('Should redirect to the consultations dashboard when already responded', async () => {
      vi.mocked(fetchConsultation).mockResolvedValueOnce(respondedConsultation)
      const h = { view: vi.fn(), redirect: vi.fn() }

      await consultationResponseController.handler(
        { params: { marineLicenceId } },
        h
      )

      expect(h.redirect).toHaveBeenCalledWith(routes.CONSULTATIONS)
      expect(h.view).not.toHaveBeenCalled()
    })

    test('Should throw not found when no consultation is returned', async () => {
      vi.mocked(fetchConsultation).mockResolvedValueOnce(undefined)

      await expect(
        consultationResponseController.handler(
          { params: { marineLicenceId } },
          { view: vi.fn() }
        )
      ).rejects.toThrow('Consultation not found')
    })
  })

  describe('#consultationResponseSubmitController', () => {
    test('Should send the response and redirect to the consultation dashboard page', async () => {
      const request = {
        params: { marineLicenceId },
        payload: { consultationResponse: 'No objections' }
      }
      const h = { redirect: vi.fn() }

      await consultationResponseSubmitController.handler(request, h)

      expect(authenticatedPatchRequest).toHaveBeenCalledWith(
        request,
        apiRoutes.UPDATE_CONSULTATION_REQUEST,
        { response: 'No objections', id: marineLicenceId }
      )
      expect(h.redirect).toHaveBeenCalledWith(routes.CONSULTATIONS)
    })

    test('Should redirect to the consultations dashboard without sending when already responded', async () => {
      vi.mocked(fetchConsultation).mockResolvedValueOnce(respondedConsultation)
      const h = { redirect: vi.fn() }

      await consultationResponseSubmitController.handler(
        {
          params: { marineLicenceId },
          payload: { consultationResponse: 'No objections' }
        },
        h
      )

      expect(authenticatedPatchRequest).not.toHaveBeenCalled()
      expect(h.redirect).toHaveBeenCalledWith(routes.CONSULTATIONS)
    })

    test('Should not redirect when the API request fails', async () => {
      vi.mocked(authenticatedPatchRequest).mockRejectedValueOnce(
        new Error('API error')
      )
      const h = { redirect: vi.fn() }

      await expect(
        consultationResponseSubmitController.handler(
          {
            params: { marineLicenceId },
            payload: { consultationResponse: 'No objections' }
          },
          h
        )
      ).rejects.toThrow('API error')
      expect(h.redirect).not.toHaveBeenCalled()
    })

    test('Should render errors in failAction', async () => {
      const payload = { consultationResponse: '' }
      const takeover = vi.fn()
      const h = { view: vi.fn().mockReturnValue({ takeover }) }

      await consultationResponseSubmitController.options.validate.failAction(
        { params: { marineLicenceId }, payload },
        h,
        {
          details: [
            {
              path: ['consultationResponse'],
              message: 'CONSULTATION_RESPONSE_REQUIRED'
            }
          ]
        }
      )

      const error = {
        href: '#consultationResponse',
        text: 'Enter your response to the consultation',
        field: ['consultationResponse']
      }
      expect(h.view).toHaveBeenCalledWith(CONSULTATION_RESPONSE_VIEW_ROUTE, {
        ...viewContext,
        payload,
        errors: { consultationResponse: error },
        errorSummary: [error]
      })
      expect(takeover).toHaveBeenCalled()
    })
  })
})
