import { vi } from 'vitest'
import { getMarineLicenceCache } from '#src/server/common/helpers/marine-licence/session-cache/utils.js'
import { buildCYASiteData } from '#src/server/common/helpers/marine-licence/check-your-answers/site-data.js'
import {
  checkYourAnswersController,
  CHECK_YOUR_ANSWERS_VIEW_ROUTE
} from '#src/server/marine-licence/check-your-answers/controller.js'
import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'

vi.mock('#src/server/common/helpers/marine-licence/session-cache/utils.js')
vi.mock(
  '#src/server/common/helpers/marine-licence/check-your-answers/site-data.js'
)

describe('#checkYourAnswersController', () => {
  let mockRequest
  let mockH

  const getMarineLicenceCacheMock = vi.mocked(getMarineLicenceCache)
  const buildCYASiteDataMock = vi.mocked(buildCYASiteData)

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
      }
    }
    const mockSummaryData = [{ siteNumber: 1, siteName: 'Test Site' }]

    getMarineLicenceCacheMock.mockReturnValue(mockCachedData)
    buildCYASiteDataMock.mockResolvedValue({
      coordinatesType: 'coordinates',
      summaryData: mockSummaryData
    })

    await checkYourAnswersController.handler(mockRequest, mockH)

    expect(getMarineLicenceCacheMock).toHaveBeenCalledWith(mockRequest)
    expect(buildCYASiteDataMock).toHaveBeenCalledWith(mockCachedData, mockRequest)
    expect(mockH.view).toHaveBeenCalledWith(CHECK_YOUR_ANSWERS_VIEW_ROUTE, {
      pageTitle: 'Check your answers before sending your information',
      backLink: marineLicenceRoutes.MARINE_LICENCE_TASK_LIST,
      ...mockCachedData,
      coordinatesType: 'coordinates',
      summaryData: mockSummaryData,
      reviewSiteDetailsRoute:
        marineLicenceRoutes.MARINE_LICENCE_REVIEW_SITE_DETAILS,
      publicRegisterRoute:
        marineLicenceRoutes.MARINE_LICENCE_PUBLIC_REGISTER
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

    await checkYourAnswersController.handler(mockRequest, mockH)

    expect(mockH.view).toHaveBeenCalledWith(CHECK_YOUR_ANSWERS_VIEW_ROUTE, {
      pageTitle: 'Check your answers before sending your information',
      backLink: marineLicenceRoutes.MARINE_LICENCE_TASK_LIST,
      ...mockCachedData,
      coordinatesType: null,
      summaryData: [],
      reviewSiteDetailsRoute:
        marineLicenceRoutes.MARINE_LICENCE_REVIEW_SITE_DETAILS,
      publicRegisterRoute:
        marineLicenceRoutes.MARINE_LICENCE_PUBLIC_REGISTER
    })
  })
})
