import { vi } from 'vitest'
import {
  consultationDetailsController,
  notificationOfApplicationController,
  requestForAdviceController,
  notificationOfApplicationViewRoute,
  requestForAdviceViewRoute
} from './controller.js'
import { authenticatedGetRequest } from '#src/server/common/helpers/authenticated-requests.js'
import { apiRoutes, routes } from '#src/server/common/constants/routes.js'
import { mockMarineLicenceWithConsultationApplication } from '#src/server/test-helpers/mocks/marine-licence-mocks.js'

vi.mock('~/src/server/common/helpers/authenticated-requests.js')

describe('#consultation-details', () => {
  const authenticatedGetRequestMock = vi.mocked(authenticatedGetRequest)
  const { consultation } = mockMarineLicenceWithConsultationApplication
  const marineLicenceId = consultation.id
  const request = { params: { marineLicenceId } }

  const mockGetConsultation = (consultationType) =>
    authenticatedGetRequestMock.mockResolvedValueOnce({
      payload: {
        value: { consultation: { ...consultation, consultationType } }
      }
    })

  describe('#consultationDetailsController', () => {
    test.each([
      [
        'APPLICATION_NOTIFICATION',
        `/marine-licence/notification-of-application/${marineLicenceId}`
      ],
      [
        'REQUEST_FOR_ADVICE',
        `/marine-licence/request-for-advice/${marineLicenceId}`
      ]
    ])(
      'Should fetch the consultation and redirect %s to %s',
      async (consultationType, expected) => {
        mockGetConsultation(consultationType)
        const h = { redirect: vi.fn() }

        await consultationDetailsController.handler(request, h)

        expect(authenticatedGetRequestMock).toHaveBeenCalledWith(
          request,
          apiRoutes.GET_CONSULTATION.replace(
            '{marineLicenceId}',
            marineLicenceId
          )
        )
        expect(h.redirect).toHaveBeenCalledWith(expected)
      }
    )
  })

  describe('#notificationOfApplicationController', () => {
    test('Should fetch the consultation and render the template', async () => {
      mockGetConsultation('APPLICATION_NOTIFICATION')
      const h = { view: vi.fn() }

      await notificationOfApplicationController.handler(request, h)

      expect(authenticatedGetRequestMock).toHaveBeenCalledWith(
        request,
        apiRoutes.GET_CONSULTATION.replace('{marineLicenceId}', marineLicenceId)
      )
      expect(h.view).toHaveBeenCalledWith(notificationOfApplicationViewRoute, {
        pageTitle: 'Notification of a marine licence application',
        heading: 'Notification of a marine licence application',
        marineLicenceId,
        projectName: consultation.projectName,
        hasResponded: false,
        viewApplicationLink: `/marine-licence/view-details/${marineLicenceId}`,
        responseLink: `/marine-licence/consultation-response/${marineLicenceId}`,
        backLink: routes.CONSULTATIONS
      })
    })
  })

  describe('#requestForAdviceController', () => {
    test('Should fetch the consultation and render the template', async () => {
      mockGetConsultation('REQUEST_FOR_ADVICE')
      const h = { view: vi.fn() }

      await requestForAdviceController.handler(request, h)

      expect(authenticatedGetRequestMock).toHaveBeenCalledWith(
        request,
        apiRoutes.GET_CONSULTATION.replace('{marineLicenceId}', marineLicenceId)
      )
      expect(h.view).toHaveBeenCalledWith(requestForAdviceViewRoute, {
        pageTitle: 'Request for advice for a marine licence application',
        heading: 'Request for advice for a marine licence application',
        marineLicenceId,
        projectName: consultation.projectName,
        hasResponded: false,
        viewApplicationLink: `/marine-licence/view-details/${marineLicenceId}`,
        responseLink: `/marine-licence/consultation-response/${marineLicenceId}`,
        backLink: routes.CONSULTATIONS
      })
    })
  })
})
