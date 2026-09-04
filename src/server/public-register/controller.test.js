import { vi } from 'vitest'
import Wreck from '@hapi/wreck'
import { getTraceId } from '@defra/hapi-tracing'
import { config } from '#src/config/config.js'
import {
  publicRegisterBrowseController,
  PUBLIC_REGISTER_VIEW_ROUTE
} from './controller.js'
import { routes } from '#src/server/common/constants/routes.js'
import { formatEntriesForDisplay } from './utils.js'

vi.mock('@hapi/wreck')
vi.mock('@defra/hapi-tracing')

describe('#publicRegisterBrowseController', () => {
  const wreckGetMock = vi.mocked(Wreck.get)
  const getTraceIdMock = vi.mocked(getTraceId)

  const createRequest = () => ({
    h: { view: vi.fn() },
    request: {
      logger: { error: vi.fn() }
    }
  })

  beforeEach(() => {
    getTraceIdMock.mockReturnValue(undefined)
    vi.spyOn(config, 'get').mockImplementation((key) => {
      if (key === 'publicRegister') {
        return { apiUrl: 'http://localhost:3003' }
      }
      if (key === 'tracing.header') {
        return 'x-cdp-request-id'
      }
      return undefined
    })
  })

  test('renders the public register with sorted entries', async () => {
    const entries = [
      {
        applicationId: 'abc123',
        applicationType: 'exemption',
        applicationReference: 'EXE/2026/00012',
        projectName: 'South coast sea samples',
        marinePlanAreas: ['South'],
        dateSubmitted: '2026-03-18',
        status: 'Active'
      }
    ]

    wreckGetMock.mockResolvedValueOnce({
      payload: entries
    })

    const { h, request } = createRequest()

    await publicRegisterBrowseController.handler(request, h)

    expect(wreckGetMock).toHaveBeenCalledWith(
      'http://localhost:3003/application-submissions',
      {
        headers: {
          'Content-Type': 'application/json'
        },
        json: true
      }
    )
    expect(h.view).toHaveBeenCalledWith(PUBLIC_REGISTER_VIEW_ROUTE, {
      pageTitle: 'Public register - Get permission for marine work',
      heading: 'Public register',
      resultCount: 1,
      rows: formatEntriesForDisplay(entries),
      serviceUrl: routes.PUBLIC_REGISTER_BROWSE
    })
  })

  test('includes the tracing header when a trace id is present', async () => {
    getTraceIdMock.mockReturnValue('trace-123')
    wreckGetMock.mockResolvedValueOnce({ payload: [] })

    const { h, request } = createRequest()

    await publicRegisterBrowseController.handler(request, h)

    expect(wreckGetMock).toHaveBeenCalledWith(
      'http://localhost:3003/application-submissions',
      {
        headers: {
          'Content-Type': 'application/json',
          'x-cdp-request-id': 'trace-123'
        },
        json: true
      }
    )
  })

  test('supports wrapped API responses', async () => {
    wreckGetMock.mockResolvedValueOnce({
      payload: {
        value: [
          {
            applicationId: 'abc123',
            applicationType: 'exemption',
            applicationReference: 'EXE/2026/00012'
          }
        ]
      }
    })

    const { h, request } = createRequest()

    await publicRegisterBrowseController.handler(request, h)

    expect(h.view).toHaveBeenCalledWith(
      PUBLIC_REGISTER_VIEW_ROUTE,
      expect.objectContaining({
        resultCount: 1
      })
    )
  })

  test('renders an empty table when the payload shape is unexpected', async () => {
    wreckGetMock.mockResolvedValueOnce({
      payload: { unexpected: true }
    })

    const { h, request } = createRequest()

    await publicRegisterBrowseController.handler(request, h)

    expect(h.view).toHaveBeenCalledWith(
      PUBLIC_REGISTER_VIEW_ROUTE,
      expect.objectContaining({
        resultCount: 0,
        rows: []
      })
    )
  })

  test('renders an empty state when the API call fails', async () => {
    wreckGetMock.mockRejectedValueOnce(new Error('network'))

    const { h, request } = createRequest()

    await publicRegisterBrowseController.handler(request, h)

    expect(request.logger.error).toHaveBeenCalled()
    expect(h.view).toHaveBeenCalledWith(PUBLIC_REGISTER_VIEW_ROUTE, {
      pageTitle: 'Public register - Get permission for marine work',
      heading: 'Public register',
      resultCount: 0,
      rows: [],
      serviceUrl: routes.PUBLIC_REGISTER_BROWSE,
      errorLoading: true
    })
  })
})
