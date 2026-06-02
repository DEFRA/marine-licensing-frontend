import { vi } from 'vitest'
import { authenticatedGetRequest } from '#src/server/common/helpers/authenticated-requests.js'
import { adminReportsController, DASHBOARD_VIEW_ROUTE } from './controller.js'

vi.mock('~/src/server/common/helpers/authenticated-requests.js')

const DASHBOARD_PAGE_TITLE = 'Exemptions summary report'

const emptyStats = {
  coordinatesInputMethod: {
    shapefile: 0,
    kml: 0,
    manualCoordinates: 0
  },
  coordinateSystemVolume: {
    wgs84: { count: 0, percentage: '0%' },
    bng: { count: 0, percentage: '0%' },
    total: 0
  },
  byArticleRows: [],
  byMarinePlanAreaRows: [],
  byCoastalOperationsAreaRows: []
}

const createRequest = () => ({
  h: { view: vi.fn() },
  request: {
    logger: { error: vi.fn() },
    auth: { credentials: { isTeamAdmin: true } }
  }
})

const createExpectedViewModel = (summary, stats = emptyStats, hasApiError = false) => ({
  pageTitle: DASHBOARD_PAGE_TITLE,
  heading: DASHBOARD_PAGE_TITLE,
  summary,
  stats,
  hasApiError
})

const fullApiValue = {
  submittedExemptions: 12,
  unsubmittedExemptions: 7,
  withdrawnExemptions: 2,
  coordinatesInputMethod: {
    shapefile: 1,
    kml: 2,
    manualCoordinates: 3
  },
  coordinateSystemVolume: {
    wgs84: { count: 3, percentage: 75 },
    bng: { count: 1, percentage: 25 },
    total: 4
  },
  byArticle: { 25: 2 },
  byMarinePlanArea: { 'East inshore': 2 },
  byCoastalOperationsArea: { South: 1 }
}

const fullStats = {
  coordinatesInputMethod: {
    shapefile: 1,
    kml: 2,
    manualCoordinates: 3
  },
  coordinateSystemVolume: {
    wgs84: { count: 3, percentage: '75%' },
    bng: { count: 1, percentage: '25%' },
    total: 4
  },
  byArticleRows: [[{ text: '25' }, { text: '2' }]],
  byMarinePlanAreaRows: [[{ text: 'East inshore' }, { text: '2' }]],
  byCoastalOperationsAreaRows: [[{ text: 'South' }, { text: '1' }]]
}

describe('Admin exemptions summary report success handling', () => {
  const authenticatedGetRequestMock = vi.mocked(authenticatedGetRequest)

  test('Should render summary report with API response values', async () => {
    authenticatedGetRequestMock.mockResolvedValueOnce({
      payload: { value: fullApiValue }
    })

    const { h, request } = createRequest()
    await adminReportsController.handler(request, h)

    expect(authenticatedGetRequestMock).toHaveBeenCalledWith(
      request,
      '/exemptions/summary'
    )
    expect(h.view).toHaveBeenCalledWith(
      DASHBOARD_VIEW_ROUTE,
      createExpectedViewModel(
        {
          submittedExemptions: 12,
          unsubmittedExemptions: 7,
          withdrawnExemptions: 2
        },
        fullStats
      )
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
        emptyStats,
        true
      )
    )
  })
})
