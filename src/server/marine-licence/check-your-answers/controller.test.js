import { vi } from 'vitest'
import { getMarineLicenceCache } from '#src/server/common/helpers/marine-licence/session-cache/utils.js'
import { buildCYASiteData } from '#src/server/common/helpers/marine-licence/check-your-answers/site-data.js'
import { buildSummaryData } from '#src/server/common/helpers/marine-licence/summary-data.js'
import {
  checkYourAnswersController,
  checkYourAnswersContinueController,
  CHECK_YOUR_ANSWERS_VIEW_ROUTE
} from '#src/server/marine-licence/check-your-answers/controller.js'
import {
  marineLicenceRoutes,
  routes
} from '#src/server/common/constants/routes.js'
import { mockMarineLicenceApplication } from '~/src/server/test-helpers/mocks/marine-licence-mocks.js'

vi.mock('#src/server/common/helpers/marine-licence/session-cache/utils.js')
vi.mock(
  '#src/server/common/helpers/marine-licence/check-your-answers/site-data.js'
)
vi.mock('#src/server/common/helpers/marine-licence/summary-data.js')

describe('#checkYourAnswersController', () => {
  let mockRequest
  let mockH

  const getMarineLicenceCacheMock = vi.mocked(getMarineLicenceCache)
  const buildCYASiteDataMock = vi.mocked(buildCYASiteData)
  const buildSummaryDataMock = vi.mocked(buildSummaryData)

  beforeEach(() => {
    mockH = {
      view: vi.fn()
    }
    mockRequest = {
      yar: {}
    }
  })

  test('handler should render with correct context including site data', async () => {
    const mockCachedData = {
      id: '123',
      projectName: 'Test Project',
      specialLegalPowers: {
        agree: 'yes',
        details: 'We have statutory powers under the Marine Act.'
      },
      ...mockMarineLicenceApplication,
      publicRegisterRoute:
        '/marine-licence/sharing-your-project-information-publicly'
    }
    const mockSummaryData = [{ siteNumber: 1, siteName: 'Test Site' }]

    getMarineLicenceCacheMock.mockReturnValue(mockCachedData)
    buildCYASiteDataMock.mockResolvedValue({
      coordinatesType: 'coordinates',
      summaryData: mockSummaryData
    })
    buildSummaryDataMock.mockReturnValue({
      ...mockCachedData,
      preferredDates: 'July 2026 to August 2027'
    })

    await checkYourAnswersController.handler(mockRequest, mockH)

    expect(getMarineLicenceCacheMock).toHaveBeenCalledWith(mockRequest)
    expect(buildCYASiteDataMock).toHaveBeenCalledWith(
      mockCachedData,
      mockRequest
    )
    expect(buildSummaryDataMock).toHaveBeenCalledWith(mockCachedData)
    expect(mockH.view).toHaveBeenCalledWith(CHECK_YOUR_ANSWERS_VIEW_ROUTE, {
      pageTitle: 'Check your answers before sending your information',
      backLink: marineLicenceRoutes.MARINE_LICENCE_TASK_LIST,
      ...mockCachedData,
      preferredDates: 'July 2026 to August 2027',
      coordinatesType: 'coordinates',
      summaryData: mockSummaryData,
      reviewSiteDetailsRoute:
        marineLicenceRoutes.MARINE_LICENCE_REVIEW_SITE_DETAILS,
      publicRegisterRoute: marineLicenceRoutes.MARINE_LICENCE_PUBLIC_REGISTER
    })
  })

  test('handler should render with empty site data when no sites exist', async () => {
    const mockCachedData = {
      id: '456',
      projectName: 'No Sites Project'
    }

    getMarineLicenceCacheMock.mockReturnValue(mockCachedData)
    buildCYASiteDataMock.mockResolvedValue({
      coordinatesType: null,
      summaryData: []
    })
    buildSummaryDataMock.mockReturnValue({
      ...mockCachedData,
      preferredDates: null
    })

    await checkYourAnswersController.handler(mockRequest, mockH)

    expect(buildSummaryDataMock).toHaveBeenCalledWith(mockCachedData)
    expect(mockH.view).toHaveBeenCalledWith(CHECK_YOUR_ANSWERS_VIEW_ROUTE, {
      pageTitle: 'Check your answers before sending your information',
      backLink: marineLicenceRoutes.MARINE_LICENCE_TASK_LIST,
      ...mockCachedData,
      preferredDates: null,
      coordinatesType: null,
      summaryData: [],
      reviewSiteDetailsRoute:
        marineLicenceRoutes.MARINE_LICENCE_REVIEW_SITE_DETAILS,
      publicRegisterRoute: marineLicenceRoutes.MARINE_LICENCE_PUBLIC_REGISTER
    })
  })
})

describe('#checkYourAnswersContinueController', () => {
  test('handler should redirect to declaration', async () => {
    const mockH = { redirect: vi.fn() }
    await checkYourAnswersContinueController.handler({}, mockH)
    expect(mockH.redirect).toHaveBeenCalledWith(routes.DECLARATION)
  })
})
