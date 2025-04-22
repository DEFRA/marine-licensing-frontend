import { createServer } from '~/src/server/index.js'
import { statusCodes } from '~/src/server/common/constants/status-codes.js'
import { config } from '~/src/config/config.js'
import Wreck from '@hapi/wreck'
import { JSDOM } from 'jsdom'

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
      payload: { projectName: '' }
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
})

/**
 * @import { Server } from '@hapi/hapi'
 */
