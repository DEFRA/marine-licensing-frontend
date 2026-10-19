import { vi } from 'vitest'
import {
  consultationsController,
  CONSULTATIONS_VIEW_ROUTE
} from './controller.js'
import { authenticatedGetRequest } from '#src/server/common/helpers/authenticated-requests.js'
import { apiRoutes } from '#src/server/common/constants/routes.js'
import { mockConsultations } from '#src/server/test-helpers/mocks/marine-licence-mocks.js'

vi.mock('~/src/server/common/helpers/authenticated-requests.js')

describe('#consultationsController', () => {
  const authenticatedGetRequestMock = vi.mocked(authenticatedGetRequest)

  test('Should fetch consultations and render the template', async () => {
    authenticatedGetRequestMock.mockResolvedValueOnce({
      payload: { value: { consultations: mockConsultations } }
    })

    const h = { view: vi.fn() }
    const request = { logger: { error: vi.fn() } }

    await consultationsController.handler(request, h)

    expect(authenticatedGetRequestMock).toHaveBeenCalledWith(
      request,
      apiRoutes.GET_CONSULTATIONS
    )
    expect(h.view).toHaveBeenCalledWith(CONSULTATIONS_VIEW_ROUTE, {
      pageTitle: 'Consultations',
      heading: 'Consultations',
      consultations: expect.arrayContaining([expect.any(Array)])
    })
  })

  test('Should log the error and render an empty table when the fetch fails', async () => {
    authenticatedGetRequestMock.mockRejectedValueOnce(new Error('API Error'))

    const h = { view: vi.fn() }
    const request = { logger: { error: vi.fn() } }

    await consultationsController.handler(request, h)

    expect(request.logger.error).toHaveBeenCalledWith(
      { err: expect.any(Error) },
      'Error fetching consultations'
    )
    expect(h.view).toHaveBeenCalledWith(CONSULTATIONS_VIEW_ROUTE, {
      pageTitle: 'Consultations',
      heading: 'Consultations',
      consultations: []
    })
  })
})
