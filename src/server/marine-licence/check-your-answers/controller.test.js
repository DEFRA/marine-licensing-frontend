import { vi } from 'vitest'
import { getMarineLicenceCache } from '#src/server/common/helpers/marine-licence/session-cache/utils.js'
import { getMarineLicenceService } from '#src/services/marine-licence-service/index.js'
import { buildSiteData } from '#src/server/common/helpers/marine-licence/site-data.js'
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
vi.mock('#src/services/marine-licence-service/index.js')
vi.mock('#src/server/common/helpers/marine-licence/site-data.js')
vi.mock('#src/server/common/helpers/marine-licence/summary-data.js')

describe('#checkYourAnswersController', () => {
  let mockRequest
  let mockH
  let mockGetMarineLicenceById

  const getMarineLicenceCacheMock = vi.mocked(getMarineLicenceCache)
  const buildSiteDataMock = vi.mocked(buildSiteData)
  const buildSummaryDataMock = vi.mocked(buildSummaryData)

  beforeEach(() => {
    mockGetMarineLicenceById = vi.fn()
    vi.mocked(getMarineLicenceService).mockReturnValue({
      getMarineLicenceById: mockGetMarineLicenceById
    })
    mockH = {
      view: vi.fn()
    }
    mockRequest = {
      yar: { flash: vi.fn() }
    }
  })

  test('handler should render with correct context including site data', async () => {
    const mockCachedData = {
      projectName: 'Test Project',
      specialLegalPowers: {
        agree: 'yes',
        details: 'We have statutory powers under the Marine Act.'
      },
      ...mockMarineLicenceApplication,
      publicRegisterRoute:
        '/marine-licence/sharing-your-project-information-publicly'
    }
    const mockCompleteLicence = { ...mockCachedData, siteDetails: [] }
    const mockSummaryData = [{ siteNumber: 1, siteName: 'Test Site' }]

    getMarineLicenceCacheMock.mockReturnValue(mockCachedData)
    mockGetMarineLicenceById.mockResolvedValue(mockCompleteLicence)
    buildSiteDataMock.mockReturnValue({
      coordinatesType: 'coordinates',
      summaryData: mockSummaryData
    })
    buildSummaryDataMock.mockReturnValue({
      ...mockCachedData,
      preferredDates: 'July 2026 to August 2027'
    })

    await checkYourAnswersController.handler(mockRequest, mockH)

    expect(getMarineLicenceCacheMock).toHaveBeenCalledWith(mockRequest)
    expect(mockRequest.yar.flash).toHaveBeenCalledWith(
      'returnTo',
      marineLicenceRoutes.MARINE_LICENCE_CHECK_YOUR_ANSWERS,
      true
    )
    expect(mockGetMarineLicenceById).toHaveBeenCalledWith(
      mockMarineLicenceApplication.id
    )
    expect(buildSiteDataMock).toHaveBeenCalledWith(mockCompleteLicence)
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

  test('handler should render with empty site data when id present but no sites', async () => {
    const mockCachedData = { ...mockMarineLicenceApplication }
    const mockCompleteLicence = { ...mockCachedData, siteDetails: [] }

    getMarineLicenceCacheMock.mockReturnValue(mockCachedData)
    mockGetMarineLicenceById.mockResolvedValue(mockCompleteLicence)
    buildSiteDataMock.mockReturnValue({ coordinatesType: null, summaryData: [] })
    buildSummaryDataMock.mockReturnValue({
      ...mockCachedData,
      preferredDates: null
    })

    await checkYourAnswersController.handler(mockRequest, mockH)

    expect(mockGetMarineLicenceById).toHaveBeenCalledWith(
      mockMarineLicenceApplication.id
    )
    expect(buildSiteDataMock).toHaveBeenCalledWith(mockCompleteLicence)
    expect(mockH.view).toHaveBeenCalledWith(
      CHECK_YOUR_ANSWERS_VIEW_ROUTE,
      expect.objectContaining({
        coordinatesType: null,
        summaryData: []
      })
    )
  })

  test('handler should render with empty site data when no id in cache', async () => {
    const mockCachedData = {
      projectName: 'No Id Project'
    }

    getMarineLicenceCacheMock.mockReturnValue(mockCachedData)
    buildSummaryDataMock.mockReturnValue({
      ...mockCachedData,
      preferredDates: null
    })

    await checkYourAnswersController.handler(mockRequest, mockH)

    expect(mockGetMarineLicenceById).not.toHaveBeenCalled()
    expect(buildSiteDataMock).not.toHaveBeenCalled()
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
