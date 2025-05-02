import { createServer } from '~/src/server/index.js'
import { statusCodes } from '~/src/server/common/constants/status-codes.js'
import { config } from '~/src/config/config.js'
import { JSDOM } from 'jsdom'
import * as cacheUtils from '~/src/server/common/helpers/session-cache/utils.js'
import {
  taskListController,
  TASK_LIST_ROUTE,
  TASK_LIST_VIEW_ROUTE
} from '~/src/server/exemption/task-list/controller.js'

describe('#taskListController', () => {
  /** @type {Server} */
  let server
  let getExemptionCacheSpy

  const mockExemptionState = { projectName: 'Test Project' }

  beforeAll(async () => {
    server = await createServer()
    await server.initialize()
  })

  beforeEach(() => {
    jest.resetAllMocks()
    getExemptionCacheSpy = jest
      .spyOn(cacheUtils, 'getExemptionCache')
      .mockReturnValue(mockExemptionState)
  })

  afterAll(async () => {
    await server.stop({ timeout: 0 })
  })

  test('Should provide expected response when loading page', async () => {
    const { result, statusCode } = await server.inject({
      method: 'GET',
      url: TASK_LIST_ROUTE
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

  test('taskListController handler should render with correct context', () => {
    const h = { view: jest.fn() }

    taskListController.handler({}, h)

    expect(h.view).toHaveBeenCalledWith(TASK_LIST_VIEW_ROUTE, {
      pageTitle: 'Task list',
      heading: 'Task list',
      projectName: 'Test Project'
    })

    getExemptionCacheSpy.mockResolvedValueOnce(null)

    taskListController.handler({}, h)

    expect(h.view).toHaveBeenNthCalledWith(2, TASK_LIST_VIEW_ROUTE, {
      pageTitle: 'Task list',
      heading: 'Task list',
      projectName: undefined
    })
  })
})

/**
 * @import { Server } from '@hapi/hapi'
 */
