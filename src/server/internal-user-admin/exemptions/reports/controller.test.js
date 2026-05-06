import { vi } from 'vitest'
import { authenticatedGetRequest } from '#src/server/common/helpers/authenticated-requests.js'
import { adminReportsController, DASHBOARD_VIEW_ROUTE } from './controller.js'

vi.mock('~/src/server/common/helpers/authenticated-requests.js')

const DASHBOARD_PAGE_TITLE = 'Exemptions summary report'

const createRequest = () => ({
  h: { view: vi.fn() },
  request: {
    logger: { error: vi.fn() },
    auth: { credentials: { isTeamAdmin: true } }
  }
})

const createExpectedViewModel = (summary, hasApiError = false) => ({
  pageTitle: DASHBOARD_PAGE_TITLE,
  heading: DASHBOARD_PAGE_TITLE,
  summary,
  hasApiError
})

describe('Admin exemptions summary report success handling', () => {
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
    expect(h.view).toHaveBeenCalledWith(
      DASHBOARD_VIEW_ROUTE,
      createExpectedViewModel({
        submittedExemptions: 12,
        unsubmittedExemptions: 7,
        withdrawnExemptions: 2
      })
    )
  })

  test('Should fallback to zero values when payload is missing', async () => {
    authenticatedGetRequestMock.mockResolvedValueOnce({ payload: {} })

    const { h, request } = createRequest()
    await adminReportsController.handler(request, h)

    expect(h.view).toHaveBeenCalledWith(
      DASHBOARD_VIEW_ROUTE,
      createExpectedViewModel({
        submittedExemptions: 0,
        unsubmittedExemptions: 0,
        withdrawnExemptions: 0
      })
    )
  })

  test('Should default missing values to zero for partial payloads', async () => {
    authenticatedGetRequestMock.mockResolvedValueOnce({
      payload: {
        value: {
          submittedExemptions: 5
        }
      }
    })

    const { h, request } = createRequest()
    await adminReportsController.handler(request, h)

    expect(h.view).toHaveBeenCalledWith(
      DASHBOARD_VIEW_ROUTE,
      createExpectedViewModel({
        submittedExemptions: 5,
        unsubmittedExemptions: 0,
        withdrawnExemptions: 0
      })
    )
  })
})

describe('Admin exemptions summary report error handling', () => {
  const authenticatedGetRequestMock = vi.mocked(authenticatedGetRequest)

  test('Should handle API errors gracefully', async () => {
    authenticatedGetRequestMock.mockRejectedValueOnce(new Error('API Error'))

    const { h, request } = createRequest()
    await adminReportsController.handler(request, h)

    expect(request.logger.error).toHaveBeenCalledWith(
      { err: expect.any(Error) },
      'Error rendering internal admin summary report page'
    )
    expect(h.view).toHaveBeenCalledWith(
      DASHBOARD_VIEW_ROUTE,
      createExpectedViewModel(
        {
          submittedExemptions: 0,
          unsubmittedExemptions: 0,
          withdrawnExemptions: 0
        },
        true
      )
    )
  })
})
