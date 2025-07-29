import { createServer } from '~/src/server/index.js'
import { statusCodes } from '~/src/server/common/constants/status-codes.js'
import {
  catchAll,
  errorDescriptionByFieldName,
  mapErrorsForDisplay
} from '~/src/server/common/helpers/errors.js'

describe('#errors', () => {
  /** @type {Server} */
  let server

  beforeAll(async () => {
    server = await createServer()
    await server.initialize()
  })

  afterAll(async () => {
    await server.stop({ timeout: 0 })
  })

  test('Should provide expected Not Found page', async () => {
    const { result, statusCode } = await server.inject({
      method: 'GET',
      url: '/non-existent-path'
    })

    expect(result).toEqual(
      expect.stringContaining('Page not found | Get permission for marine work')
    )
    expect(statusCode).toBe(statusCodes.notFound)
  })
})

describe('#catchAll', () => {
  const mockErrorLogger = jest.fn()
  const mockStack = 'Mock error stack'
  const errorPage = 'error/index'
  const mockRequest = (/** @type {number} */ statusCode) => ({
    response: {
      isBoom: true,
      stack: mockStack,
      output: {
        statusCode
      }
    },
    logger: { error: mockErrorLogger }
  })
  const mockToolkitView = jest.fn()
  const mockToolkitCode = jest.fn()
  const mockToolkit = {
    view: mockToolkitView.mockReturnThis(),
    code: mockToolkitCode.mockReturnThis()
  }

  test('Should provide expected "Not Found" page', () => {
    catchAll(mockRequest(statusCodes.notFound), mockToolkit)

    expect(mockErrorLogger).not.toHaveBeenCalledWith(mockStack)
    expect(mockToolkitView).toHaveBeenCalledWith(errorPage, {
      pageTitle: 'Page not found',
      heading: statusCodes.notFound,
      message: 'Page not found'
    })
    expect(mockToolkitCode).toHaveBeenCalledWith(statusCodes.notFound)
  })

  test('Should provide expected "Forbidden" page', () => {
    catchAll(mockRequest(statusCodes.forbidden), mockToolkit)

    expect(mockErrorLogger).not.toHaveBeenCalledWith(mockStack)
    expect(mockToolkitView).toHaveBeenCalledWith(errorPage, {
      pageTitle: 'Forbidden',
      heading: statusCodes.forbidden,
      message: 'Forbidden'
    })
    expect(mockToolkitCode).toHaveBeenCalledWith(statusCodes.forbidden)
  })

  test('Should provide expected "Unauthorized" page', () => {
    catchAll(mockRequest(statusCodes.unauthorized), mockToolkit)

    expect(mockErrorLogger).not.toHaveBeenCalledWith(mockStack)
    expect(mockToolkitView).toHaveBeenCalledWith(errorPage, {
      pageTitle: 'Unauthorized',
      heading: statusCodes.unauthorized,
      message: 'Unauthorized'
    })
    expect(mockToolkitCode).toHaveBeenCalledWith(statusCodes.unauthorized)
  })

  test('Should provide expected "Bad Request" page', () => {
    catchAll(mockRequest(statusCodes.badRequest), mockToolkit)

    expect(mockErrorLogger).not.toHaveBeenCalledWith(mockStack)
    expect(mockToolkitView).toHaveBeenCalledWith(errorPage, {
      pageTitle: 'Bad Request',
      heading: statusCodes.badRequest,
      message: 'Bad Request'
    })
    expect(mockToolkitCode).toHaveBeenCalledWith(statusCodes.badRequest)
  })

  test('Should provide expected default page', () => {
    catchAll(mockRequest(statusCodes.imATeapot), mockToolkit)

    expect(mockErrorLogger).not.toHaveBeenCalledWith(mockStack)
    expect(mockToolkitView).toHaveBeenCalledWith(errorPage, {
      pageTitle: 'Something went wrong',
      heading: statusCodes.imATeapot,
      message: 'Something went wrong'
    })
    expect(mockToolkitCode).toHaveBeenCalledWith(statusCodes.imATeapot)
  })

  test('Should provide expected "Something went wrong" page and log error for internalServerError', () => {
    catchAll(mockRequest(statusCodes.internalServerError), mockToolkit)

    expect(mockErrorLogger).toHaveBeenCalledWith(mockStack)
    expect(mockToolkitView).toHaveBeenCalledWith(errorPage, {
      pageTitle: 'Something went wrong',
      heading: statusCodes.internalServerError,
      message: 'Something went wrong'
    })
    expect(mockToolkitCode).toHaveBeenCalledWith(
      statusCodes.internalServerError
    )
  })
})

describe('errorDescriptionByFieldName', () => {
  test('return error formatted correctly for front end display', () => {
    const result = errorDescriptionByFieldName()
    expect(result).toEqual({})
  })

  test('return empty array when no data is provided', () => {
    const result = errorDescriptionByFieldName([
      {
        href: '#test',
        text: 'Test text',
        field: 'test'
      },
      {
        href: '#test2',
        text: 'Test text 2',
        field: 'test2'
      }
    ])

    expect(result).toEqual({
      test: {
        href: '#test',
        text: 'Test text',
        field: 'test'
      },
      test2: {
        href: '#test2',
        text: 'Test text 2',
        field: 'test2'
      }
    })
  })
})

describe('mapErrorsForDisplay', () => {
  test('return correct error message format for error summary', () => {
    const messages = {
      PROJECT_NAME_REQUIRED: 'Enter the project name',
      PROJECT_NAME_MAX_LENGTH: 'Project name should be 250 characters or less'
    }

    const result = mapErrorsForDisplay(
      [
        { message: 'PROJECT_NAME_REQUIRED', path: 'projectName' },
        { message: 'PROJECT_NAME_MAX_LENGTH', path: 'testField2' }
      ],
      messages
    )

    expect(result).toStrictEqual([
      {
        href: '#projectName',
        text: 'Enter the project name',
        field: 'projectName'
      },
      {
        href: '#testField2',
        text: 'Project name should be 250 characters or less',
        field: 'testField2'
      }
    ])
  })

  test('show only one error per field', () => {
    const messages = {
      PROJECT_NAME_REQUIRED: 'Enter the project name',
      PROJECT_NAME_MAX_LENGTH: 'Project name should be 250 characters or less'
    }
    const result = mapErrorsForDisplay(
      [
        { message: 'PROJECT_NAME_REQUIRED', path: 'projectName' },
        { message: 'PROJECT_NAME_MAX_LENGTH', path: 'projectName' }
      ],
      messages
    )

    expect(result).toStrictEqual([
      {
        href: '#projectName',
        text: messages.PROJECT_NAME_REQUIRED,
        field: 'projectName'
      }
    ])
  })

  test('can handle empty input array', () => {
    const result = mapErrorsForDisplay()
    expect(result).toEqual([])
  })

  it('returns h.continue for non-Boom response', () => {
    const h = {}
    const result = catchAll({ response: {} }, h)
    expect(result).toBe(h.continue)
  })
})

/**
 * @import { Server } from '@hapi/hapi'
 */
