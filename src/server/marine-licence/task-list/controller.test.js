import { vi } from 'vitest'
import {
  clearMarineLicenceCache,
  getMarineLicenceCache,
  setMarineLicenceCache
} from '#src/server/common/helpers/marine-licence/session-cache/utils.js'
import { setProjectType } from '#src/server/common/helpers/session-cache/utils.js'
import { authenticatedGetRequest } from '#src/server/common/helpers/authenticated-requests.js'
import {
  transformProjectDetailsTaskList,
  transformSiteDetailsTaskList,
  transformOtherPermissionsTaskList,
  transformSharingTaskList
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

vi.mock('#src/server/common/helpers/marine-licence/session-cache/utils.js')
vi.mock('#src/server/common/helpers/session-cache/utils.js')
vi.mock('#src/server/common/helpers/authenticated-requests.js')
vi.mock('#src/server/marine-licence/task-list/utils.js')
vi.mock('#src/server/common/plugins/auth/utils.js')

describe('#taskListController', () => {
  let mockRequest
  let mockH

  const getMarineLicenceCacheMock = vi.mocked(getMarineLicenceCache)
  const setMarineLicenceCacheMock = vi.mocked(setMarineLicenceCache)
  const clearMarineLicenceCacheMock = vi.mocked(clearMarineLicenceCache)
  const authenticatedGetRequestMock = vi.mocked(authenticatedGetRequest)

  const mockMarineLicence = {
    id: '123',
    projectName: 'Test Project',
    siteDetails: [{ siteName: 'some-site' }]
  }

  beforeEach(() => {
    mockH = {
      view: vi.fn(),
      redirect: vi.fn()
    }
    mockRequest = {
      yar: {}
    }
  })

  test('taskListController handler should render with correct context', async () => {
    const mockPayload = {
      value: {
        id: '123',
        projectName: 'Test Project',
        taskList: {
          projectName: 'COMPLETED',
          specialLegalPowers: 'COMPLETED'
        },
        siteDetails: mockMarineLicence.siteDetails
      }
    }

    const mockProjectDetailsTaskList = [
      {
        href: '/',
        status: { text: 'Completed' },
        title: { classes: 'govuk-link--no-visited-state', text: 'Project name' }
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

    getMarineLicenceCacheMock.mockReturnValue(mockMarineLicence)
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
    vi.mocked(transformSharingTaskList).mockReturnValue(mockSharingTaskList)
    vi.mocked(setMarineLicenceCache).mockResolvedValue(mockMarineLicence)

    authUtils.getUserSession.mockResolvedValue({
      userRelationshipType: 'CITIZEN'
    })

    await taskListController.handler(mockRequest, mockH)

    expect(getMarineLicenceCacheMock).toHaveBeenCalledWith(mockRequest)
    expect(authenticatedGetRequestMock).toHaveBeenCalledWith(
      mockRequest,
      '/marine-licence/123'
    )
    expect(vi.mocked(transformProjectDetailsTaskList)).toHaveBeenCalledWith(
      mockPayload.value.taskList
    )
    expect(vi.mocked(transformSiteDetailsTaskList)).toHaveBeenCalledWith(
      mockPayload.value.taskList
    )
    expect(vi.mocked(setMarineLicenceCache)).toHaveBeenCalledWith(
      mockRequest,
      mockH,
      mockMarineLicence
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
      projectDetailsTaskList: mockProjectDetailsTaskList,
      siteDetailsTaskList: mockSiteDetailsTaskList,
      sharingTaskList: mockSharingTaskList
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
    getMarineLicenceCacheMock.mockReturnValue(mockMarineLicence)

    const mockRequestWithParams = {
      ...mockRequest,
      query: { cancel: 'site-details' }
    }

    await taskListController.handler(mockRequestWithParams, mockH)

    expect(setMarineLicenceCacheMock).toHaveBeenCalledWith(
      expect.any(Object),
      expect.any(Object),
      {
        ...mockMarineLicence,
        siteDetails: []
      }
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
