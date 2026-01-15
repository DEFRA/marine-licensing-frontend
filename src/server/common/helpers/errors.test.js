import { vi } from 'vitest'
import { statusCodes } from '#src/server/common/constants/status-codes.js'
import {
  catchAll,
  errorDescriptionByFieldName,
  mapErrorsForDisplay
} from '#src/server/common/helpers/errors.js'

import { setupTestServer } from '#tests/integration/shared/test-setup-helpers.js'
import { makeGetRequest } from '#src/server/test-helpers/server-requests.js'

describe('#errors', () => {
  const getServer = setupTestServer()

  test('Should provide expected Not Found page', async () => {
    const { result, statusCode } = await makeGetRequest({
      url: '/non-existent-path',
      server: getServer()
    })

    expect(result).toEqual(expect.stringContaining('Page not found'))
    expect(statusCode).toBe(statusCodes.notFound)
  })
})

describe('#catchAll', () => {
  const mockErrorLogger = vi.fn()
  const mockStack = 'Mock error stack'

  // The 500 custom error page is also doing double duty as our generic error page.
  const genericErrorPage = 'error/500-server-error'

  const customErrorPages = {
    403: 'error/403-forbidden',
    404: 'error/404-not-found',
    500: 'error/500-server-error',
    503: 'error/503-service-unavailable'
  }
  const mockRequest = (/** @type {number} */ statusCode) => ({
    response: {
      isBoom: true,
      stack: mockStack,
      output: {
        statusCode
      }
    },
    logger: { error: mockErrorLogger },
    path: '/test-path',
    method: 'GET'
  })

  const mockToolkitView = vi.fn()
  const mockToolkitCode = vi.fn()
  const mockToolkitRedirect = vi.fn().mockReturnValue({
    takeover: vi.fn()
  })

  const mockToolkit = {
    view: mockToolkitView,
    code: mockToolkitCode,
    redirect: mockToolkitRedirect
  }

  beforeEach(() => {
    mockToolkitView.mockReturnValue(mockToolkit)
    mockToolkitCode.mockReturnValue(mockToolkit)
  })

  test('Should provide expected "Not Found" page', () => {
    catchAll(mockRequest(statusCodes.notFound), mockToolkit)

    expect(mockErrorLogger).not.toHaveBeenCalledWith(mockStack)
    expect(mockToolkitView).toHaveBeenCalledWith(customErrorPages['404'])
    expect(mockToolkitCode).toHaveBeenCalledWith(statusCodes.notFound)
  })

  test('Should provide expected "Forbidden" page', () => {
    catchAll(mockRequest(statusCodes.forbidden), mockToolkit)

    expect(mockErrorLogger).not.toHaveBeenCalledWith(mockStack)
    expect(mockToolkitView).toHaveBeenCalledWith(customErrorPages['403'])
    expect(mockToolkitCode).toHaveBeenCalledWith(statusCodes.forbidden)
  })

  test('Should provide expected "Unauthorized" page', () => {
    catchAll(mockRequest(statusCodes.unauthorized), mockToolkit)

    expect(mockErrorLogger).not.toHaveBeenCalledWith(mockStack)
    expect(mockToolkitView).toHaveBeenCalledWith(genericErrorPage)
    expect(mockToolkitCode).toHaveBeenCalledWith(statusCodes.unauthorized)
  })

  test('Should provide expected "Bad Request" page', () => {
    catchAll(mockRequest(statusCodes.badRequest), mockToolkit)

    expect(mockErrorLogger).not.toHaveBeenCalledWith(mockStack)
    expect(mockToolkitView).toHaveBeenCalledWith(genericErrorPage)
    expect(mockToolkitCode).toHaveBeenCalledWith(statusCodes.badRequest)
  })

  test('Should provide expected default page', () => {
    catchAll(mockRequest(statusCodes.imATeapot), mockToolkit)

    expect(mockErrorLogger).not.toHaveBeenCalledWith(mockStack)
    expect(mockToolkitView).toHaveBeenCalledWith(genericErrorPage)
    expect(mockToolkitCode).toHaveBeenCalledWith(statusCodes.imATeapot)
  })

  test('Should provide expected default page', () => {
    catchAll(mockRequest(statusCodes.imATeapot), mockToolkit)

    expect(mockErrorLogger).not.toHaveBeenCalledWith(mockStack)
    expect(mockToolkitView).toHaveBeenCalledWith(genericErrorPage)
    expect(mockToolkitCode).toHaveBeenCalledWith(statusCodes.imATeapot)
  })

  test('Should provide expected 500-error page and log error for internalServerError', () => {
    const request = mockRequest(statusCodes.internalServerError)
    catchAll(request, mockToolkit)

    expect(mockErrorLogger).toHaveBeenCalledWith(
      {
        err: request.response,
        statusCode: statusCodes.internalServerError,
        path: request.path,
        method: request.method
      },
      'Error occurred'
    )

    expect(mockToolkitView).toHaveBeenCalledWith(customErrorPages['500'])
    expect(mockToolkitCode).toHaveBeenCalledWith(
      statusCodes.internalServerError
    )
  })

  test('Should provide expected 503 server temporarily unavailable page', () => {
    catchAll(mockRequest(statusCodes.serviceUnavailable), mockToolkit)
    expect(mockToolkitView).toHaveBeenCalledWith(customErrorPages['503'])
    expect(mockToolkitCode).toHaveBeenCalledWith(statusCodes.serviceUnavailable)
  })

  it('returns h.continue for non-Boom response', () => {
    const h = { continue: Symbol('continue') }
    const result = catchAll({ response: {} }, h)
    expect(result).toBe(h.continue)
  })

  test('Should redirect if redirectPath param is present', () => {
    const req = mockRequest(statusCodes.unauthorized)
    req.response.redirectPath = '/'
    catchAll(req, mockToolkit)
    expect(mockToolkitRedirect).toHaveBeenCalledWith('/')
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
})
