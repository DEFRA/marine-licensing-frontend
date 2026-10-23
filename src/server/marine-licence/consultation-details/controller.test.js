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

vi.mock('~/src/server/common/helpers/authenticated-requests.js')

describe('#consultation-details', () => {
  const authenticatedGetRequestMock = vi.mocked(authenticatedGetRequest)
  const marineLicenceId = 'test-consultation-id'
  const request = { params: { marineLicenceId } }

  const mockConsultation = (consultation) =>
    authenticatedGetRequestMock.mockResolvedValueOnce({
      payload: { value: { consultation } }
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
        mockConsultation({ consultationType })
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
      mockConsultation({
        consultationType: 'APPLICATION_NOTIFICATION',
        projectName: 'Test Project'
      })
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
        projectName: 'Test Project',
        viewApplicationLink: `/marine-licence/view-details/${marineLicenceId}`,
        backLink: routes.CONSULTATIONS
      })
    })
  })

  describe('#requestForAdviceController', () => {
    test('Should fetch the consultation and render the template', async () => {
      mockConsultation({
        consultationType: 'REQUEST_FOR_ADVICE',
        projectName: 'Test Project'
      })
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
        projectName: 'Test Project',
        viewApplicationLink: `/marine-licence/view-details/${marineLicenceId}`,
        backLink: routes.CONSULTATIONS
      })
    })
  })
})
