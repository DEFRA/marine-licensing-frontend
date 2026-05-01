import { vi } from 'vitest'
import { authenticatedGetRequest } from '#src/server/common/helpers/authenticated-requests.js'
import { adminReportsController, DASHBOARD_VIEW_ROUTE } from './controller.js'

vi.mock('~/src/server/common/helpers/authenticated-requests.js')

const createRequest = () => ({
  h: { view: vi.fn() },
  request: {
    logger: { error: vi.fn() },
    auth: { credentials: { isTeamAdmin: true } }
  }
})

describe('Admin exemptions summary report', () => {
  const authenticatedGetRequestMock = vi.mocked(authenticatedGetRequest)

  test('Should render summary report with API response values', async () => {
    authenticatedGetRequestMock.mockResolvedValueOnce({
      payload: {
        value: {
          submittedExemptions: 12,
          unsubmittedExemptions: 7,
          withdrawnExemptions: 2
        }
      }
    })

    const { h, request } = createRequest()
    await adminReportsController.handler(request, h)

    expect(authenticatedGetRequestMock).toHaveBeenCalledWith(
      request,
      '/exemptions/summary'
    )
    expect(h.view).toHaveBeenCalledWith(DASHBOARD_VIEW_ROUTE, {
      pageTitle: 'Exemptions summary report',
      heading: 'Exemptions summary report',
      summary: {
        submittedExemptions: 12,
        unsubmittedExemptions: 7,
        withdrawnExemptions: 2
      }
    })
  })

  test('Should fallback to zero values when payload is missing', async () => {
    authenticatedGetRequestMock.mockResolvedValueOnce({ payload: {} })

    const { h, request } = createRequest()
    await adminReportsController.handler(request, h)

    expect(h.view).toHaveBeenCalledWith(DASHBOARD_VIEW_ROUTE, {
      pageTitle: 'Exemptions summary report',
      heading: 'Exemptions summary report',
      summary: {
        submittedExemptions: 0,
        unsubmittedExemptions: 0,
        withdrawnExemptions: 0
      }
    })
  })

  test('Should handle API errors gracefully', async () => {
    authenticatedGetRequestMock.mockRejectedValueOnce(new Error('API Error'))

    const { h, request } = createRequest()
    await adminReportsController.handler(request, h)

    expect(request.logger.error).toHaveBeenCalledWith(
      { err: expect.any(Error) },
      'Error rendering internal admin summary report page'
    )
    expect(h.view).toHaveBeenCalledWith(DASHBOARD_VIEW_ROUTE, {
      pageTitle: 'Exemptions summary report',
      heading: 'Exemptions summary report',
      summary: {
        submittedExemptions: 0,
        unsubmittedExemptions: 0,
        withdrawnExemptions: 0
      }
    })
  })
})
