import { createServer } from '~/src/server/index.js'
import {
  coordinatesTypeController,
  coordinatesTypeSubmitController,
  PROVIDE_COORDINATES_CHOICE_VIEW_ROUTE,
  PROVIDE_COORDINATES_CHOICE_ROUTE
} from '~/src/server/exemption/site-details/coordinates-type/controller.js'
import * as cacheUtils from '~/src/server/common/helpers/session-cache/utils.js'
import { mockExemption } from '~/src/server/test-helpers/mocks.js'
import { statusCodes } from '~/src/server/common/constants/status-codes.js'
import { config } from '~/src/config/config.js'
import { JSDOM } from 'jsdom'

jest.mock('~/src/server/common/helpers/session-cache/utils.js')

describe('#coordinatesTypeController', () => {
  /** @type {Server} */
  let server

  beforeAll(async () => {
    server = await createServer()
    await server.initialize()
  })

  beforeEach(() => {
    jest.resetAllMocks()
    jest.spyOn(cacheUtils, 'getExemptionCache').mockReturnValue(mockExemption)
  })

  afterAll(async () => {
    await server.stop({ timeout: 0 })
  })

  test('coordinatesTypeController handler should render with correct context', () => {
    const h = { view: jest.fn() }

    coordinatesTypeController.handler({}, h)

    expect(h.view).toHaveBeenCalledWith(PROVIDE_COORDINATES_CHOICE_VIEW_ROUTE, {
      pageTitle: 'How do you want to provide the site location?',
      heading: 'How do you want to provide the site location?',
      projectName: mockExemption.projectName
    })
  })

  test('Should provide expected response and correctly pre populate data', async () => {
    const { result, statusCode } = await server.inject({
      method: 'GET',
      url: PROVIDE_COORDINATES_CHOICE_ROUTE
    })

    expect(result).toEqual(
      expect.stringContaining(
        `How do you want to provide the site location? | ${config.get('serviceName')}`
      )
    )

    const { document } = new JSDOM(result).window

    expect(document.querySelector('h1').textContent.trim()).toBe(
      'How do you want to provide the site location?'
    )

    expect(document.querySelector('.govuk-caption-l').textContent.trim()).toBe(
      mockExemption.projectName
    )

    expect(document.querySelector('#coordinatesType').value).toBe('file')

    expect(document.querySelector('#coordinatesType-2').value).toBe(
      'coordinates'
    )

    expect(
      document
        .querySelector('.govuk-back-link[href="/exemption/task-list"')
        .textContent.trim()
    ).toBe('Back')

    expect(
      document
        .querySelector('.govuk-link[href="/exemption/task-list"')
        .textContent.trim()
    ).toBe('Cancel')

    expect(statusCode).toBe(statusCodes.ok)
  })

  test('Should correctly remain on the same page when POST is successful', async () => {
    const h = {
      view: jest.fn()
    }

    await coordinatesTypeSubmitController.handler({}, h)

    expect(h.view).toHaveBeenCalledWith(PROVIDE_COORDINATES_CHOICE_VIEW_ROUTE, {
      pageTitle: 'How do you want to provide the site location?',
      heading: 'How do you want to provide the site location?',
      projectName: mockExemption.projectName
    })
  })
})

/**
 * @import { Server } from '@hapi/hapi'
 */
