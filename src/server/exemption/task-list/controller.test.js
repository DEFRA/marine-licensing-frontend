import { createServer } from '~/src/server/index.js'
import { statusCodes } from '~/src/server/common/constants/status-codes.js'
import { config } from '~/src/config/config.js'
import { JSDOM } from 'jsdom'
import * as cacheUtils from '~/src/server/common/helpers/session-cache/utils.js'
import {
  taskListController,
  TASK_LIST_VIEW_ROUTE
} from '~/src/server/exemption/task-list/controller.js'
import { mockExemption } from '~/src/server/test-helpers/mocks.js'
import { routes } from '~/src/server/common/constants/routes.js'
import * as authRequests from '~/src/server/common/helpers/authenticated-requests.js'
import {
  clearExemptionCache,
  getExemptionCache,
  setExemptionCache
} from '~/src/server/common/helpers/session-cache/utils.js'

jest.mock('~/src/server/common/helpers/session-cache/utils.js')

describe('#taskListController', () => {
  /** @type {Server} */
  let server

  const mockExemptionState = { projectName: 'Test Project' }
  const getExemptionCacheMock = jest.mocked(getExemptionCache)
  const setExemptionCacheMock = jest.mocked(setExemptionCache)

  beforeAll(async () => {
    server = await createServer()
    await server.initialize()
  })

  beforeEach(() => {
    jest.resetAllMocks()

    jest
      .spyOn(authRequests, 'authenticatedGetRequest')
      .mockResolvedValue({ payload: { value: mockExemption } })

    getExemptionCacheMock.mockReturnValue(mockExemption)
  })

  afterAll(async () => {
    await server.stop({ timeout: 0 })
  })

  test('Should provide expected response when loading page', async () => {
    const { result, statusCode } = await server.inject({
      method: 'GET',
      url: routes.TASK_LIST
    })

    expect(result).toEqual(
      expect.stringContaining(`Task list | ${config.get('serviceName')}`)
    )

    const { document } = new JSDOM(result).window

    expect(document.querySelector('h1').textContent.trim()).toBe(
      mockExemptionState.projectName
    )

    expect(document.querySelector('.govuk-caption-l').textContent.trim()).toBe(
      'Exempt activity'
    )

    expect(
      document.querySelectorAll('.govuk-task-list__link')[0].textContent.trim()
    ).toBe('Project name')

    expect(
      document
        .querySelectorAll('.govuk-task-list__status')[0]
        .textContent.trim()
    ).toBe('Completed')

    expect(statusCode).toBe(statusCodes.ok)
  })

  test('taskListController handler should render with correct context', async () => {
    const h = { view: jest.fn() }

    await taskListController.handler({}, h)

    expect(authRequests.authenticatedGetRequest).toHaveBeenCalledWith(
      expect.any(Object),
      `/exemption/${mockExemption.id}`
    )

    const exemptionWithoutTaskList = { ...mockExemption }
    delete exemptionWithoutTaskList.taskList

    expect(setExemptionCacheMock).toHaveBeenCalledWith(
      {},
      exemptionWithoutTaskList
    )

    expect(h.view).toHaveBeenCalledWith(TASK_LIST_VIEW_ROUTE, {
      pageTitle: 'Task list',
      heading: 'Task list',
      projectName: 'Test Project',
      taskList: [
        {
          href: routes.PROJECT_NAME,
          status: {
            text: 'Completed'
          },
          title: {
            text: 'Project name'
          }
        },
        {
          href: routes.ACTIVITY_DATES,
          status: {
            text: 'Completed'
          },
          title: {
            text: 'Activity dates'
          }
        },
        {
          href: routes.ACTIVITY_DESCRIPTION,
          status: {
            tag: {
              classes: 'govuk-tag--blue',
              text: 'Incomplete'
            }
          },
          title: {
            text: 'Activity description'
          }
        },
        {
          href: routes.REVIEW_SITE_DETAILS,
          status: {
            text: 'Completed'
          },
          title: {
            text: 'Site details'
          }
        },
        {
          href: routes.PUBLIC_REGISTER,
          status: {
            text: 'Completed'
          },
          title: {
            text: 'Public register'
          }
        }
      ],
      hasCompletedAllTasks: false
    })
  })

  test('taskListController handler should correctly handle request to clear cache and redirect', async () => {
    const resetExemptionSiteDetailsSpy = jest.spyOn(
      cacheUtils,
      'resetExemptionSiteDetails'
    )

    const { statusCode, headers } = await server.inject({
      method: 'GET',
      url: `${routes.TASK_LIST}?cancel=site-details`
    })

    expect(resetExemptionSiteDetailsSpy).toHaveBeenCalled()
    expect(statusCode).toBe(302)
    expect(headers.location).toBe(routes.TASK_LIST)
  })

  test('taskListController should redirect when cancel query parameter is provided but does not match', async () => {
    const resetExemptionSiteDetailsSpy = jest.spyOn(
      cacheUtils,
      'resetExemptionSiteDetails'
    )

    const { statusCode, headers } = await server.inject({
      method: 'GET',
      url: `${routes.TASK_LIST}?cancel=does-not-exist`
    })

    expect(resetExemptionSiteDetailsSpy).not.toHaveBeenCalled()
    expect(statusCode).toBe(302)
    expect(headers.location).toBe(routes.TASK_LIST)
  })

  test('taskListController handler should throw a 404 if exemption is not found', async () => {
    const h = { view: jest.fn() }

    getExemptionCacheMock.mockResolvedValueOnce(null)

    await expect(() => taskListController.handler({}, h)).rejects.toThrow(
      `Exemption not found`,
      mockExemption.id
    )
  })
})

describe('#taskListSelectExemptionController', () => {
  /** @type {Server} */
  let server

  const clearExemptionCacheMock = jest.mocked(clearExemptionCache)
  const setExemptionCacheMock = jest.mocked(setExemptionCache)

  beforeAll(async () => {
    server = await createServer()
    await server.initialize()
  })

  beforeEach(() => {
    jest.resetAllMocks()

    jest
      .spyOn(authRequests, 'authenticatedGetRequest')
      .mockResolvedValue({ payload: { value: mockExemption } })
  })

  afterAll(async () => {
    await server.stop({ timeout: 0 })
  })

  test('should clear cache and return to task list', async () => {
    const { statusCode, headers } = await server.inject({
      method: 'GET',
      url: '/exemption/task-list/abc123?from=dashboard'
    })

    expect(clearExemptionCacheMock).toHaveBeenCalled()

    expect(setExemptionCacheMock).toHaveBeenCalledWith(expect.any(Object), {
      id: 'abc123'
    })

    expect(statusCode).toBe(302)
    expect(headers.location).toBe('/exemption/task-list')
  })
})

/**
 * @import { Server } from '@hapi/hapi'
 */
