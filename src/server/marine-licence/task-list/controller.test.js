import { vi } from 'vitest'
import {
  clearMarineLicenceCache,
  getMarineLicenceCache,
  setMarineLicenceCache
} from '#src/server/common/helpers/marine-licence/session-cache/utils.js'
import { setProjectType } from '#src/server/common/helpers/session-cache/utils.js'
import { clearReturnToCache } from '#src/server/common/helpers/marine-licence/session-cache/return-to-cache.js'
import { authenticatedGetRequest } from '#src/server/common/helpers/authenticated-requests.js'
import {
  transformProjectDetailsTaskList,
  transformSiteDetailsTaskList,
  transformOtherPermissionsTaskList,
  transformSharingTaskList,
  transformWaterFrameworkDirectiveTaskList,
  transformFeeEstimateTaskList,
  transformMarinePlanPoliciesTaskList
} from '#src/server/marine-licence/task-list/utils.js'
import {
  taskListController,
  taskListSelectMarineLicenceController,
  TASK_LIST_VIEW_ROUTE
} from '#src/server/marine-licence/task-list/controller.js'
import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'
import { PROJECT_TYPE } from '#src/server/common/constants/projects.js'
import * as authUtils from '#src/server/common/plugins/auth/utils.js'
import Boom from '@hapi/boom'
import { createMockRequest } from '#src/server/test-helpers/mocks/helpers.js'
import { mockMarineLicenceApplication } from '#src/server/test-helpers/mocks/marine-licence-mocks.js'

vi.mock('#src/server/common/helpers/marine-licence/session-cache/utils.js')
vi.mock(
  '#src/server/common/helpers/marine-licence/session-cache/return-to-cache.js'
)
vi.mock('#src/server/common/helpers/session-cache/utils.js')
vi.mock('#src/server/common/helpers/authenticated-requests.js')
vi.mock('#src/server/marine-licence/task-list/utils.js')
vi.mock('#src/server/common/plugins/auth/utils.js')

describe('#taskListController', () => {
  let mockRequest
  let mockH

  const getMarineLicenceCacheMock = vi.mocked(getMarineLicenceCache)
  const clearReturnToCacheMock = vi.mocked(clearReturnToCache)
  const setMarineLicenceCacheMock = vi.mocked(setMarineLicenceCache)
  const clearMarineLicenceCacheMock = vi.mocked(clearMarineLicenceCache)
  const authenticatedGetRequestMock = vi.mocked(authenticatedGetRequest)

  beforeEach(() => {
    mockH = {
      view: vi.fn(),
      redirect: vi.fn()
    }
    mockRequest = createMockRequest()
  })

  test('taskListController handler should render with correct context', async () => {
    const mockPayload = {
      value: {
        id: '123',
        projectName: 'Test Project',
        projectBackground: 'Test project background',
        taskList: {
          feeEstimate: 'COMPLETED',
          projectName: 'COMPLETED',
          projectBackground: 'COMPLETED',
          specialLegalPowers: 'COMPLETED',
          otherAuthorities: 'COMPLETED',
          siteDetails: 'COMPLETED'
        },
        siteDetails: mockMarineLicenceApplication.siteDetails,
        otherAuthorities: {
          agree: 'yes',
          details: 'some details'
        },
        specialLegalPowers: {
          agree: 'yes',
          details: 'some special legal powers'
        },
        waterFrameworkDirective: { nauticalMile: 'no' },
        marinePlanPolicyJob: 'ready',
        marinePlanPoliciesCount: 44
      }
    }

    const mockProjectDetailsTaskList = [
      {
        href: '/',
        status: { text: 'Completed' },
        title: { classes: 'govuk-link--no-visited-state', text: 'Project name' }
      },
      {
        href: '/',
        status: { text: 'Completed' },
        title: {
          classes: 'govuk-link--no-visited-state',
          text: 'Project background'
        }
      }
    ]

    const mockOtherPermissionsTaskList = [
      {
        href: '/',
        status: { text: 'Completed' },
        title: {
          classes: 'govuk-link--no-visited-state',
          text: 'Special Legal Powers'
        }
      },
      {
        href: '/',
        status: { text: 'Completed' },
        title: {
          classes: 'govuk-link--no-visited-state',
          text: 'Other authorities'
        }
      }
    ]

    const mockwaterFrameworkDirectiveTaskList = [
      {
        href: '/',
        status: { text: 'Completed' },
        title: {
          classes: 'govuk-link--no-visited-state',
          text: 'Water framework directive'
        }
      }
    ]

    const mockSharingTaskList = [
      {
        href: '/',
        status: { text: 'Completed' },
        title: {
          classes: 'govuk-link--no-visited-state',
          text: 'Sharing your project information publicly'
        }
      }
    ]

    const mockSiteDetailsTaskList = [
      {
        href: '/',
        status: { text: 'Completed' },
        title: { classes: 'govuk-link--no-visited-state', text: 'Site details' }
      }
    ]

    const mockFeeEstimateTaskList = [
      {
        href: '/',
        status: { text: 'Completed' },
        title: { classes: 'govuk-link--no-visited-state', text: 'Fee estimate' }
      }
    ]

    getMarineLicenceCacheMock.mockReturnValue(mockMarineLicenceApplication)
    const mockMarinePlanPoliciesTaskList = [
      {
        href: marineLicenceRoutes.MARINE_LICENCE_MARINE_PLAN_POLICIES,
        status: {
          tag: { text: 'Not yet started', classes: 'govuk-tag--blue' }
        },
        title: {
          classes: 'govuk-link--no-visited-state',
          text: 'Marine plan policy considerations (44 to complete)'
        }
      }
    ]

    getMarineLicenceCacheMock.mockReturnValue(mockMarineLicenceApplication)
    authenticatedGetRequestMock.mockResolvedValue({
      payload: mockPayload
    })
    vi.mocked(transformProjectDetailsTaskList).mockReturnValue(
      mockProjectDetailsTaskList
    )
    vi.mocked(transformSiteDetailsTaskList).mockReturnValue(
      mockSiteDetailsTaskList
    )
    vi.mocked(transformOtherPermissionsTaskList).mockReturnValue(
      mockOtherPermissionsTaskList
    )
    vi.mocked(transformWaterFrameworkDirectiveTaskList).mockReturnValue(
      mockwaterFrameworkDirectiveTaskList
    )
    vi.mocked(transformSharingTaskList).mockReturnValue(mockSharingTaskList)
    vi.mocked(transformFeeEstimateTaskList).mockReturnValue(
      mockFeeEstimateTaskList
    )
    vi.mocked(transformMarinePlanPoliciesTaskList).mockReturnValue(
      mockMarinePlanPoliciesTaskList
    )
    vi.mocked(setMarineLicenceCache).mockResolvedValue(
      mockMarineLicenceApplication
    )

    authUtils.getUserSession.mockResolvedValue({
      userRelationshipType: 'CITIZEN'
    })

    await taskListController.handler(mockRequest, mockH)

    expect(getMarineLicenceCacheMock).toHaveBeenCalledWith(mockRequest)
    expect(clearReturnToCacheMock).toHaveBeenCalledWith(mockRequest)
    expect(authenticatedGetRequestMock).toHaveBeenCalledWith(
      mockRequest,
      `/marine-licence/${mockMarineLicenceApplication.id}`
    )
    expect(vi.mocked(transformProjectDetailsTaskList)).toHaveBeenCalledWith(
      mockPayload.value.taskList
    )
    expect(vi.mocked(transformFeeEstimateTaskList)).toHaveBeenCalledWith(
      mockPayload.value.taskList
    )
    expect(vi.mocked(transformSiteDetailsTaskList)).toHaveBeenCalledWith(
      mockPayload.value.taskList
    )
    expect(
      vi.mocked(transformWaterFrameworkDirectiveTaskList)
    ).toHaveBeenCalledWith(
      mockPayload.value.taskList,
      mockPayload.value.waterFrameworkDirective
    )
    expect(vi.mocked(transformMarinePlanPoliciesTaskList)).toHaveBeenCalledWith(
      mockPayload.value.taskList,
      {
        marinePlanPolicyJob: 'ready',
        marinePlanPoliciesCount: 44
      }
    )

    expect(vi.mocked(setMarineLicenceCache)).toHaveBeenCalledWith(
      mockRequest,
      mockH,
      expect.objectContaining({
        id: mockPayload.value.id,
        projectName: mockPayload.value.projectName,
        projectBackground: mockPayload.value.projectBackground,
        specialLegalPowers: mockPayload.value.specialLegalPowers,
        otherAuthorities: mockPayload.value.otherAuthorities,
        siteDetails: mockPayload.value.siteDetails,
        waterFrameworkDirective: mockPayload.value.waterFrameworkDirective
      })
    )
    expect(vi.mocked(setProjectType)).toHaveBeenCalledWith(
      mockRequest,
      mockH,
      PROJECT_TYPE.MARINE_LICENCE
    )
    expect(mockH.view).toHaveBeenCalledWith(TASK_LIST_VIEW_ROUTE, {
      hasCompletedAllTasks: true,
      pageTitle: 'Marine licence start page',
      heading: 'Marine licence start page',
      projectName: 'Test Project',
      otherPermissionsTaskList: mockOtherPermissionsTaskList,
      feeEstimateTaskList: mockFeeEstimateTaskList,
      projectDetailsTaskList: mockProjectDetailsTaskList,
      siteDetailsTaskList: mockSiteDetailsTaskList,
      sharingTaskList: mockSharingTaskList,
      waterFrameworkDirectiveTaskList: mockwaterFrameworkDirectiveTaskList,
      marinePlanPoliciesTaskList: mockMarinePlanPoliciesTaskList
    })
  })

  test('taskListController handler should throw not found when id is missing', async () => {
    getMarineLicenceCacheMock.mockReturnValue({})

    await expect(
      taskListController.handler(mockRequest, mockH)
    ).rejects.toThrow(Boom.notFound('Marine licence not found'))

    expect(getMarineLicenceCacheMock).toHaveBeenCalledWith(mockRequest)
    expect(authenticatedGetRequestMock).not.toHaveBeenCalled()
  })

  test('taskListController handler should throw not found when cache is empty', async () => {
    getMarineLicenceCacheMock.mockReturnValue({})

    await expect(
      taskListController.handler(mockRequest, mockH)
    ).rejects.toThrow(Boom.notFound('Marine licence not found'))

    expect(getMarineLicenceCacheMock).toHaveBeenCalledWith(mockRequest)
    expect(authenticatedGetRequestMock).not.toHaveBeenCalled()
  })

  test('taskListController handler should correctly handle request to clear cache', async () => {
    getMarineLicenceCacheMock.mockReturnValue(mockMarineLicenceApplication)
    authenticatedGetRequestMock.mockResolvedValue({
      payload: { value: mockMarineLicenceApplication }
    })

    const mockRequestWithParams = {
      ...mockRequest,
      query: { cancel: 'site-details' }
    }

    await taskListController.handler(mockRequestWithParams, mockH)

    expect(setMarineLicenceCacheMock).toHaveBeenCalledWith(
      expect.any(Object),
      expect.any(Object),
      expect.objectContaining({ siteDetails: [] })
    )
  })

  test('taskListSelectMarineLicenceController should clear cache and return to task list', async () => {
    const mockRequestWithParams = { ...mockRequest, params: { id: '123' } }
    await taskListSelectMarineLicenceController.handler(
      mockRequestWithParams,
      mockH
    )

    expect(clearMarineLicenceCacheMock).toHaveBeenCalled()

    expect(setMarineLicenceCacheMock).toHaveBeenCalledWith(
      expect.any(Object),
      expect.any(Object),
      {
        id: '123'
      }
    )

    expect(mockH.redirect).toHaveBeenCalledWith(
      marineLicenceRoutes.MARINE_LICENCE_TASK_LIST
    )
  })
})
