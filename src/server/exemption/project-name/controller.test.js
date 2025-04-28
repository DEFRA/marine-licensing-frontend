import { createServer } from '~/src/server/index.js'
import { statusCodes } from '~/src/server/common/constants/status-codes.js'
import { config } from '~/src/config/config.js'
import Wreck from '@hapi/wreck'
import { JSDOM } from 'jsdom'
import { projectNameSubmitController } from '~/src/server/exemption/project-name/controller.js'

describe('#projectNameController', () => {
  /** @type {Server} */
  let server

  beforeAll(async () => {
    server = await createServer()
    await server.initialize()
  })

  beforeEach(() => {
    jest.resetAllMocks()
  })

  afterAll(async () => {
    await server.stop({ timeout: 0 })
  })

  test('Should provide expected response', async () => {
    const { result, statusCode } = await server.inject({
      method: 'GET',
      url: '/exemption/project-name'
    })

    expect(result).toEqual(
      expect.stringContaining(`Project name | ${config.get('serviceName')}`)
    )
    expect(statusCode).toBe(statusCodes.ok)
  })

  test('Should provide expected response with valid data', async () => {
    const apiPostMock = jest.spyOn(Wreck, 'post')
    apiPostMock.mockResolvedValueOnce({
      res: { statusCode: 200 },
      payload: { data: 'test' }
    })

    const { result, statusCode } = await server.inject({
      method: 'POST',
      url: '/exemption/project-name',
      payload: { projectName: 'Project name' }
    })

    expect(result).toEqual(
      expect.stringContaining(`Project name | ${config.get('serviceName')}`)
    )

    const { document } = new JSDOM(result).window

    expect(document.querySelector('h1').textContent.trim()).toBe('Project name')

    expect(
      document.querySelector('input[aria-describedby="projectName-hint"]')
    ).toBeTruthy()

    const button = document.querySelector('[data-module="govuk-button"]')
    expect(button).toBeTruthy()
    expect(button.textContent.trim()).toBe('Save and continue')

    expect(statusCode).toBe(statusCodes.ok)
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
      url: '/exemption/project-name',
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

    expect(h.view).toHaveBeenCalledWith('exemption/project-name/index', {
      heading: 'Project Name',
      pageTitle: 'Project name',
      payload: { projectName: '' },
      errors: [
        {
          href: '#projectName',
          text: 'TEST',
          field: ['projectName']
        }
      ],
      errorSummary: {
        projectName: {
          field: ['projectName'],
          href: '#projectName',
          text: 'TEST'
        }
      }
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

    expect(h.view).toHaveBeenCalledWith('exemption/project-name/index', {
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
      url: '/exemption/project-name',
      payload: { projectName: '' }
    })

    expect(apiPostMock).not.toHaveBeenCalled()

    const { document } = new JSDOM(result).window

    expect(document.querySelector('.govuk-error-summary')).toBeTruthy()
  })
})

/**
 * @import { Server } from '@hapi/hapi'
 */
