import { createServer } from '~/src/server/index.js'
import { statusCodes } from '~/src/server/common/constants/status-codes.js'
import { mockExemption } from '~/src/server/test-helpers/mocks.js'
import { config } from '~/src/config/config.js'
import Wreck from '@hapi/wreck'
import { JSDOM } from 'jsdom'
import {
  projectNameSubmitController,
  projectNameController,
  PROJECT_NAME_ROUTE,
  PROJECT_NAME_VIEW_ROUTE
} from '~/src/server/exemption/project-name/controller.js'
import * as cacheUtils from '~/src/server/common/helpers/session-cache/utils.js'

jest.mock('~/src/server/common/helpers/session-cache/utils.js')

describe('#projectNameController', () => {
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

    jest
      .spyOn(Wreck, 'post')
      .mockReturnValue({ payload: { id: mockExemption.id } })

    getExemptionCacheSpy = jest
      .spyOn(cacheUtils, 'getExemptionCache')
      .mockReturnValue(mockExemptionState)
  })

  afterAll(async () => {
    await server.stop({ timeout: 0 })
  })

  test('Should provide expected response and correctly pre populate data', async () => {
    const { result, statusCode } = await server.inject({
      method: 'GET',
      url: PROJECT_NAME_ROUTE
    })

    expect(result).toEqual(
      expect.stringContaining(`Project name | ${config.get('serviceName')}`)
    )

    const { document } = new JSDOM(result).window

    expect(document.querySelector('#projectName').value).toBe(
      mockExemptionState.projectName
    )

    expect(statusCode).toBe(statusCodes.ok)
  })

  test('Should provide expected response and correctly not pre populate data if it is not present', async () => {
    getExemptionCacheSpy.mockResolvedValueOnce({})

    const { result, statusCode } = await server.inject({
      method: 'GET',
      url: PROJECT_NAME_ROUTE
    })

    expect(result).toEqual(
      expect.stringContaining(`Project name | ${config.get('serviceName')}`)
    )

    const { document } = new JSDOM(result).window

    expect(document.querySelector('#projectName').value).toBeFalsy()

    expect(statusCode).toBe(statusCodes.ok)
  })

  test('Should correctly create new project and redirect to the next page on success', async () => {
    const apiPostMock = jest.spyOn(Wreck, 'post')
    apiPostMock.mockResolvedValueOnce({
      res: { statusCode: 200 },
      payload: { data: 'test' }
    })

    const { statusCode, headers } = await server.inject({
      method: 'POST',
      url: PROJECT_NAME_ROUTE,
      payload: { projectName: 'Project name' }
    })

    expect(Wreck.post).toHaveBeenCalledWith(
      `${config.get('backend').apiUrl}/exemption/project-name`,
      { payload: { projectName: 'Project name' }, json: true }
    )

    expect(statusCode).toBe(302)

    expect(headers.location).toBe('/exemption/task-list')
  })

  test('Should correctly update existing project and redirect to the next page on success', async () => {
    getExemptionCacheSpy.mockReturnValueOnce(mockExemption)

    jest.spyOn(Wreck, 'patch').mockImplementationOnce(() => jest.fn())

    const { statusCode, headers } = await server.inject({
      method: 'POST',
      url: PROJECT_NAME_ROUTE,
      payload: { projectName: 'Project name' }
    })

    expect(Wreck.patch).toHaveBeenCalledWith(
      `${config.get('backend').apiUrl}/exemption/project-name`,
      {
        payload: { projectName: 'Project name', id: mockExemption.id },
        json: true
      }
    )

    expect(statusCode).toBe(302)

    expect(headers.location).toBe('/exemption/task-list')
  })

  test('projectNameController handler should render with correct context', () => {
    const h = { view: jest.fn() }

    projectNameController.handler({}, h)

    expect(h.view).toHaveBeenCalledWith(PROJECT_NAME_VIEW_ROUTE, {
      pageTitle: 'Project name',
      heading: 'Project Name',
      payload: mockExemptionState
    })

    getExemptionCacheSpy.mockResolvedValueOnce(null)

    projectNameController.handler({}, h)

    expect(h.view).toHaveBeenNthCalledWith(2, PROJECT_NAME_VIEW_ROUTE, {
      pageTitle: 'Project name',
      heading: 'Project Name',
      payload: { projectName: undefined }
    })
  })

  test('Should show error messages with invalid data', async () => {
    const apiPostMock = jest.spyOn(Wreck, 'post')
    apiPostMock.mockRejectedValueOnce({
      res: { statusCode: 200 },
      data: {
        payload: {
          validation: {
            source: 'payload',
            keys: ['projectName'],
            details: [
              {
                field: 'projectName',
                message: 'PROJECT_NAME_REQUIRED',
                type: 'string.empty'
              }
            ]
          }
        }
      }
    })

    const { result, statusCode } = await server.inject({
      method: 'POST',
      url: PROJECT_NAME_ROUTE,
      payload: { projectName: 'test' }
    })

    expect(result).toEqual(expect.stringContaining(`Enter the project name`))

    const { document } = new JSDOM(result).window

    expect(
      document.querySelector('.govuk-error-message').textContent.trim()
    ).toBe('Error: Enter the project name')

    expect(document.querySelector('h2').textContent.trim()).toBe(
      'There is a problem'
    )

    expect(document.querySelector('.govuk-error-summary')).toBeTruthy()

    expect(statusCode).toBe(statusCodes.ok)
  })

  test('Should pass erorr to global catchAll behaviour if it is not a validation error', async () => {
    const apiPostMock = jest.spyOn(Wreck, 'post')
    apiPostMock.mockRejectedValueOnce({
      res: { statusCode: 500 },
      data: {}
    })

    const { result } = await server.inject({
      method: 'POST',
      url: PROJECT_NAME_ROUTE,
      payload: { projectName: 'test' }
    })

    expect(result).toContain('Something went wrong')

    const { document } = new JSDOM(result).window

    expect(document.querySelector('h1').textContent.trim()).toBe('500')
  })

  test('Should correctly validate on empty data', () => {
    const request = {
      payload: { projectName: '' }
    }

    const h = {
      view: jest.fn().mockReturnValue({
        takeover: jest.fn()
      })
    }

    const err = {
      details: [
        {
          path: ['projectName'],
          message: 'TEST',
          type: 'string.empty'
        }
      ]
    }

    projectNameSubmitController.options.validate.failAction(request, h, err)

    expect(h.view).toHaveBeenCalledWith(PROJECT_NAME_VIEW_ROUTE, {
      heading: 'Project Name',
      pageTitle: 'Project name',
      payload: { projectName: '' },
      errorSummary: [
        {
          href: '#projectName',
          text: 'TEST',
          field: ['projectName']
        }
      ],
      errors: {
        projectName: {
          field: ['projectName'],
          href: '#projectName',
          text: 'TEST'
        }
      }
    })

    expect(h.view().takeover).toHaveBeenCalled()
  })

  test('Should correctly handle an incorrectly formed error object', () => {
    const request = {
      payload: { projectName: '' }
    }

    const h = {
      view: jest.fn().mockReturnValue({
        takeover: jest.fn()
      })
    }

    const err = {
      details: null
    }

    projectNameSubmitController.options.validate.failAction(request, h, err)

    expect(h.view).toHaveBeenCalledWith(PROJECT_NAME_VIEW_ROUTE, {
      heading: 'Project Name',
      pageTitle: 'Project name',
      payload: { projectName: '' }
    })

    expect(h.view().takeover).toHaveBeenCalled()
  })

  test('Should correctly validate on empty data and handle a scenario where error details are missing', () => {
    const request = {
      payload: { projectName: '' }
    }

    const h = {
      view: jest.fn().mockReturnValue({
        takeover: jest.fn()
      })
    }

    projectNameSubmitController.options.validate.failAction(request, h, {})

    expect(h.view).toHaveBeenCalledWith(PROJECT_NAME_VIEW_ROUTE, {
      heading: 'Project Name',
      pageTitle: 'Project name',
      payload: { projectName: '' }
    })

    expect(h.view().takeover).toHaveBeenCalled()
  })

  test('Should show error messages without calling the back end when payload data is empty', async () => {
    const apiPostMock = jest.spyOn(Wreck, 'post')

    const { result } = await server.inject({
      method: 'POST',
      url: PROJECT_NAME_ROUTE,
      payload: { projectName: '' }
    })

    expect(apiPostMock).not.toHaveBeenCalled()

    const { document } = new JSDOM(result).window

    expect(document.querySelector('.govuk-error-summary')).toBeTruthy()
  })

  test('Should correctly set the cache when submitting a project name', async () => {
    const h = {
      redirect: jest.fn().mockReturnValue({
        takeover: jest.fn()
      }),
      view: jest.fn()
    }

    const mockRequest = { payload: { projectName: 'Project name' } }

    await projectNameSubmitController.handler(
      { payload: { projectName: 'Project name' } },
      h
    )
    expect(cacheUtils.setExemptionCache).toHaveBeenCalledWith(mockRequest, {
      projectName: 'Project name'
    })
  })
})

/**
 * @import { Server } from '@hapi/hapi'
 */
