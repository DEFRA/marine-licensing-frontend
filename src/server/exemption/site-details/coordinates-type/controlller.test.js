import { createServer } from '~/src/server/index.js'
import {
  coordinatesTypeController,
  coordinatesTypeSubmitController,
  PROVIDE_COORDINATES_CHOICE_VIEW_ROUTE
} from '~/src/server/exemption/site-details/coordinates-type/controller.js'
import * as cacheUtils from '~/src/server/common/helpers/session-cache/utils.js'
import { mockExemption } from '~/src/server/test-helpers/mocks.js'

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
