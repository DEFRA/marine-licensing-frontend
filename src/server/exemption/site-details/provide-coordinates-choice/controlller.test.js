import { createServer } from '~/src/server/index.js'
import {
  provideCoordinatesChoiceController,
  PROVIDE_COORDINATES_CHOICE_VIEW_ROUTE
} from '~/src/server/exemption/site-details/provide-coordinates-choice/controller.js'

jest.mock('~/src/server/common/helpers/session-cache/utils.js')

describe('#provideCoordinatesChoiceController', () => {
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

  test('provideCoordinatesChoiceController handler should render with correct context', () => {
    const h = { view: jest.fn() }

    provideCoordinatesChoiceController.handler({}, h)

    expect(h.view).toHaveBeenCalledWith(PROVIDE_COORDINATES_CHOICE_VIEW_ROUTE, {
      pageTitle: 'How do you want to provide the site location?',
      heading: 'How do you want to provide the site location?'
    })
  })
})

/**
 * @import { Server } from '@hapi/hapi'
 */
