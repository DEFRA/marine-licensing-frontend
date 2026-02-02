import { vi } from 'vitest'
import {
  getMarineLicenseCache,
  setMarineLicenseCache
} from '#src/server/common/helpers/marine-license/session-cache/utils.js'
import { authenticatedGetRequest } from '#src/server/common/helpers/authenticated-requests.js'
import { transformTaskList } from '#src/server/marine-license/task-list/utils.js'
import {
  taskListController,
  TASK_LIST_VIEW_ROUTE
} from '#src/server/marine-license/task-list/controller.js'
import { marineLicenseRoutes } from '#src/server/common/constants/routes.js'
import Boom from '@hapi/boom'

vi.mock('#src/server/common/helpers/marine-license/session-cache/utils.js')
vi.mock('#src/server/common/helpers/authenticated-requests.js')
vi.mock('#src/server/marine-license/task-list/utils.js')

describe('#taskListController', () => {
  let mockRequest
  let mockH

  const getMarineLicenseCacheMock = vi.mocked(getMarineLicenseCache)
  const authenticatedGetRequestMock = vi.mocked(authenticatedGetRequest)

  beforeEach(() => {
    mockH = {
      view: vi.fn()
    }
    mockRequest = {
      yar: {}
    }
  })

  test('taskListController handler should render with correct context', async () => {
    const mockMarineLicense = {
      id: '123',
      projectName: 'Test Project'
    }
    const mockPayload = {
      value: {
        id: '123',
        projectName: 'Test Project',
        taskList: {
          projectName: 'COMPLETED'
        }
      }
    }
    const mockTransformedTaskList = [
      {
        href: marineLicenseRoutes.MARINE_LICENSE_PROJECT_NAME,
        status: { text: 'Completed' },
        title: {
          classes: 'govuk-link--no-visited-state',
          text: 'Project name'
        }
      }
    ]

    getMarineLicenseCacheMock.mockReturnValue(mockMarineLicense)
    authenticatedGetRequestMock.mockResolvedValue({
      payload: mockPayload
    })
    vi.mocked(transformTaskList).mockReturnValue(mockTransformedTaskList)
    vi.mocked(setMarineLicenseCache).mockResolvedValue(mockMarineLicense)

    await taskListController.handler(mockRequest, mockH)

    expect(getMarineLicenseCacheMock).toHaveBeenCalledWith(mockRequest)
    expect(authenticatedGetRequestMock).toHaveBeenCalledWith(
      mockRequest,
      '/marine-license/123'
    )
    expect(vi.mocked(transformTaskList)).toHaveBeenCalledWith(
      mockPayload.value.taskList
    )
    expect(vi.mocked(setMarineLicenseCache)).toHaveBeenCalledWith(
      mockRequest,
      mockH,
      {
        id: '123',
        projectName: 'Test Project'
      }
    )
    expect(mockH.view).toHaveBeenCalledWith(TASK_LIST_VIEW_ROUTE, {
      pageTitle: 'Marine licence start page',
      heading: 'Marine licence start page',
      projectName: 'Test Project',
      taskList: mockTransformedTaskList
    })
  })

  test('taskListController handler should throw not found when id is missing', async () => {
    getMarineLicenseCacheMock.mockReturnValue({})

    await expect(
      taskListController.handler(mockRequest, mockH)
    ).rejects.toThrow(Boom.notFound('Marine license not found'))

    expect(getMarineLicenseCacheMock).toHaveBeenCalledWith(mockRequest)
    expect(authenticatedGetRequestMock).not.toHaveBeenCalled()
  })

  test('taskListController handler should throw not found when cache is empty', async () => {
    getMarineLicenseCacheMock.mockReturnValue({})

    await expect(
      taskListController.handler(mockRequest, mockH)
    ).rejects.toThrow(Boom.notFound('Marine license not found'))

    expect(getMarineLicenseCacheMock).toHaveBeenCalledWith(mockRequest)
    expect(authenticatedGetRequestMock).not.toHaveBeenCalled()
  })
})
