import { vi } from 'vitest'
import {
  getMarineLicenceCache,
  setMarineLicenceCache
} from '#src/server/common/helpers/marine-licence/session-cache/utils.js'
import { setReturnToCache } from '#src/server/common/helpers/marine-licence/session-cache/return-to-cache.js'
import { getMarineLicenceService } from '#src/services/marine-licence-service/index.js'
import { buildSiteData } from '#src/server/common/helpers/marine-licence/site-data.js'
import { buildSummaryData } from '#src/server/common/helpers/marine-licence/summary-data.js'
import { buildMarinePlanPoliciesData } from '#src/server/common/helpers/marine-licence/marine-plan-policies-data.js'
import {
  checkYourAnswersController,
  checkYourAnswersContinueController,
  CHECK_YOUR_ANSWERS_VIEW_ROUTE
} from '#src/server/marine-licence/check-your-answers/controller.js'
import {
  marineLicenceRoutes,
  routes
} from '#src/server/common/constants/routes.js'
import {
  mockMarineLicenceApplication,
  withReadyToSend
} from '~/src/server/test-helpers/mocks/marine-licence-mocks.js'
import { getUserSession } from '#src/server/common/plugins/auth/utils.js'
import { USER_TYPES } from '#src/server/common/constants/user-types.js'
import {
  FEE_ESTIMATE_AMOUNT,
  FEE_ESTIMATE_MONITORING_AMOUNT
} from '#src/server/common/validation/fee-estimate/constants.js'
import {
  NAUTICAL_MILE_HEADING,
  EXCLUDED_ACTIVITIES_HEADING,
  FILE_UPLOAD_HEADING
} from '#src/server/common/helpers/marine-licence/water-framework-directive/water-framework-review-data.js'

vi.mock('#src/server/common/helpers/marine-licence/session-cache/utils.js')
vi.mock(
  '#src/server/common/helpers/marine-licence/session-cache/return-to-cache.js'
)
vi.mock('#src/services/marine-licence-service/index.js')
vi.mock('#src/server/common/plugins/auth/utils.js')
vi.mock('#src/server/common/helpers/marine-licence/site-data.js')
vi.mock('#src/server/common/helpers/marine-licence/summary-data.js')
vi.mock(
  '#src/server/common/helpers/marine-licence/marine-plan-policies-data.js'
)

const expectedInvoicingData = mockMarineLicenceApplication.invoicing

const expectedWaterFrameworkDirectiveData = {
  excludedActivities: {
    key: {
      text: EXCLUDED_ACTIVITIES_HEADING
    },
    value: {
      text: 'No'
    }
  },
  nauticalMile: {
    key: {
      text: NAUTICAL_MILE_HEADING
    },
    value: {
      text: 'Yes'
    }
  },
  uploadedFile: {
    key: {
      text: FILE_UPLOAD_HEADING
    },
    value: {
      text: 'test-upload-id'
    }
  }
}

describe('#checkYourAnswersController', () => {
  let mockRequest
  let mockH
  let mockGetMarineLicenceById
  let mockPolicies

  const getMarineLicenceCacheMock = vi.mocked(getMarineLicenceCache)
  const setMarineLicenceCacheMock = vi.mocked(setMarineLicenceCache)
  const setReturnToCacheMock = vi.mocked(setReturnToCache)
  const buildSiteDataMock = vi.mocked(buildSiteData)
  const buildSummaryDataMock = vi.mocked(buildSummaryData)

  beforeEach(() => {
    mockGetMarineLicenceById = vi.fn()
    vi.mocked(getMarineLicenceService).mockReturnValue({
      getMarineLicenceById: mockGetMarineLicenceById
    })
    mockH = {
      view: vi.fn(),
      redirect: vi.fn()
    }
    mockRequest = {}
    vi.mocked(getUserSession).mockResolvedValue({
      userRelationshipType: USER_TYPES.CITIZEN
    })
    mockPolicies = [
      {
        policyCode: 'S-CC-1',
        wording: 'Wording',
        response: 'Consideration',
        changeHref: '/marine-licence/marine-plan-policy/S-CC-1'
      }
    ]
    vi.mocked(buildMarinePlanPoliciesData).mockReturnValue(mockPolicies)
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
    const mockCompleteLicence = withReadyToSend({
      ...mockCachedData,
      siteDetails: []
    })
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

    setReturnToCacheMock.mockResolvedValue(undefined)
    setMarineLicenceCacheMock.mockResolvedValue(undefined)

    await checkYourAnswersController.handler(mockRequest, mockH)

    expect(getMarineLicenceCacheMock).toHaveBeenCalledWith(mockRequest)
    expect(setReturnToCacheMock).toHaveBeenCalledWith(
      mockRequest,
      mockH,
      marineLicenceRoutes.MARINE_LICENCE_CHECK_YOUR_ANSWERS
    )
    expect(mockGetMarineLicenceById).toHaveBeenCalledWith(
      mockMarineLicenceApplication.id
    )
    expect(buildSiteDataMock).toHaveBeenCalledWith(mockCompleteLicence)
    expect(buildSummaryDataMock).toHaveBeenCalledWith(mockCachedData)
    expect(buildMarinePlanPoliciesData).toHaveBeenCalledWith(
      mockCompleteLicence
    )
    expect(mockH.view).toHaveBeenCalledWith(CHECK_YOUR_ANSWERS_VIEW_ROUTE, {
      pageTitle: 'Check your answers before sending your information',
      backLink: marineLicenceRoutes.MARINE_LICENCE_TASK_LIST,
      ...mockCachedData,
      preferredDates: 'July 2026 to August 2027',
      coordinatesType: 'coordinates',
      summaryData: mockSummaryData,
      reviewSiteDetailsRoute:
        marineLicenceRoutes.MARINE_LICENCE_REVIEW_SITE_DETAILS,
      publicRegisterRoute: marineLicenceRoutes.MARINE_LICENCE_PUBLIC_REGISTER,
      waterFrameworkDirectiveData: expectedWaterFrameworkDirectiveData,
      waterFrameworkDirectiveChangeLink:
        marineLicenceRoutes.MARINE_LICENCE_WATER_FRAMEWORK_DIRECTIVE_REVIEW_YOUR_ANSWERS,
      feeEstimateChangeLink: '/marine-licence/fee-estimate',
      invoicingData: expectedInvoicingData,
      invoicingChangeLink:
        marineLicenceRoutes.MARINE_LICENCE_CHECK_INVOICING_DETAILS,
      marinePlanPolicySections: mockPolicies,
      amount: FEE_ESTIMATE_AMOUNT,
      monitoringAmount: FEE_ESTIMATE_MONITORING_AMOUNT
    })
  })

  test('redirects to the task list when the application is not ready to send', async () => {
    const readyLicence = withReadyToSend(mockMarineLicenceApplication)
    getMarineLicenceCacheMock.mockReturnValue({
      id: mockMarineLicenceApplication.id
    })
    mockGetMarineLicenceById.mockResolvedValue({
      ...readyLicence,
      taskList: { ...readyLicence.taskList, siteDetails: 'IN_PROGRESS' }
    })

    await checkYourAnswersController.handler(mockRequest, mockH)

    expect(mockH.redirect).toHaveBeenCalledWith(
      marineLicenceRoutes.MARINE_LICENCE_TASK_LIST
    )
    expect(mockH.view).not.toHaveBeenCalled()
    expect(setReturnToCacheMock).not.toHaveBeenCalled()
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
    setReturnToCacheMock.mockResolvedValue(undefined)

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
      feeEstimateChangeLink: '/marine-licence/fee-estimate',
      invoicingChangeLink: '/marine-licence/check-invoicing-details',
      invoicingData: undefined,
      waterFrameworkDirectiveData: {},
      reviewSiteDetailsRoute:
        marineLicenceRoutes.MARINE_LICENCE_REVIEW_SITE_DETAILS,
      publicRegisterRoute: marineLicenceRoutes.MARINE_LICENCE_PUBLIC_REGISTER,
      marinePlanPolicySections: [],
      amount: FEE_ESTIMATE_AMOUNT,
      monitoringAmount: FEE_ESTIMATE_MONITORING_AMOUNT
    })
  })
})

describe('#checkYourAnswersContinueController', () => {
  let mockH
  let mockGetMarineLicenceById

  beforeEach(() => {
    mockH = { redirect: vi.fn() }
    mockGetMarineLicenceById = vi.fn()
    vi.mocked(getMarineLicenceService).mockReturnValue({
      getMarineLicenceById: mockGetMarineLicenceById
    })
    vi.mocked(getMarineLicenceCache).mockReturnValue({
      id: mockMarineLicenceApplication.id
    })
    vi.mocked(getUserSession).mockResolvedValue({
      userRelationshipType: USER_TYPES.CITIZEN
    })
  })

  test('redirects to the declaration when the application is ready to send', async () => {
    mockGetMarineLicenceById.mockResolvedValue(
      withReadyToSend(mockMarineLicenceApplication)
    )

    await checkYourAnswersContinueController.handler({}, mockH)

    expect(mockH.redirect).toHaveBeenCalledWith(routes.DECLARATION)
  })

  describe('when only special legal powers is unfinished', () => {
    beforeEach(() => {
      const readyLicence = withReadyToSend(mockMarineLicenceApplication)
      mockGetMarineLicenceById.mockResolvedValue({
        ...readyLicence,
        taskList: { ...readyLicence.taskList, specialLegalPowers: 'INCOMPLETE' }
      })
    })

    test('redirects a citizen to the declaration', async () => {
      await checkYourAnswersContinueController.handler({}, mockH)

      expect(mockH.redirect).toHaveBeenCalledWith(routes.DECLARATION)
    })

    test('redirects an employee to the task list', async () => {
      vi.mocked(getUserSession).mockResolvedValue({
        userRelationshipType: 'Employee'
      })

      await checkYourAnswersContinueController.handler({}, mockH)

      expect(mockH.redirect).toHaveBeenCalledWith(
        marineLicenceRoutes.MARINE_LICENCE_TASK_LIST
      )
    })
  })

  test('redirects to the task list when the application is not ready to send', async () => {
    const readyLicence = withReadyToSend(mockMarineLicenceApplication)
    mockGetMarineLicenceById.mockResolvedValue({
      ...readyLicence,
      taskList: { ...readyLicence.taskList, siteDetails: 'IN_PROGRESS' }
    })

    await checkYourAnswersContinueController.handler({}, mockH)

    expect(mockH.redirect).toHaveBeenCalledWith(
      marineLicenceRoutes.MARINE_LICENCE_TASK_LIST
    )
    expect(mockH.redirect).not.toHaveBeenCalledWith(routes.DECLARATION)
  })
})
