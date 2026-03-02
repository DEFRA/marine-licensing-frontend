import { vi } from 'vitest'
import { exemption } from '#src/server/exemption/index.js'
import { getPageViewCommonData } from '#src/server/common/helpers/page-view-common-data.js'
import { getUserSession } from '#src/server/common/plugins/auth/utils.js'
import { routes } from '#src/server/common/constants/routes.js'
import { USER_TYPES } from '#src/server/common/constants/user-types.js'

vi.mock('~/src/server/common/helpers/page-view-common-data.js')
vi.mock('~/src/server/common/plugins/auth/utils.js')
vi.mock('~/src/server/common/helpers/defraid-login/session-cache.js')

describe('exemption route', () => {
  test('route is registered correctly', () => {
    const server = {
      route: vi.fn(),
      ext: vi.fn()
    }

    exemption.plugin.register(server)

    expect(server.ext).toHaveBeenCalledTimes(2)
    expect(server.ext).toHaveBeenCalledWith(
      'onPreHandler',
      expect.any(Function)
    )
    expect(server.ext).toHaveBeenCalledWith(
      'onPreResponse',
      expect.any(Function)
    )
    expect(server.route).toHaveBeenCalledTimes(1)
    expect(server.route).toHaveBeenCalledWith([
      expect.objectContaining({
        method: 'GET',
        path: '/exemption'
      }),
      expect.objectContaining({
        method: 'GET',
        path: '/exemption/project-name'
      }),
      expect.objectContaining({
        method: 'POST',
        path: '/exemption/project-name'
      }),
      expect.objectContaining({
        method: 'GET',
        path: '/exemption/sharing-your-project-information-publicly'
      }),
      expect.objectContaining({
        method: 'POST',
        path: '/exemption/sharing-your-project-information-publicly'
      }),
      expect.objectContaining({
        method: 'GET',
        path: '/exemption/task-list'
      }),
      expect.objectContaining({
        method: 'GET',
        path: '/exemption/task-list/{exemptionId}'
      }),
      expect.objectContaining({
        method: 'GET',
        path: '/exemption/how-do-you-want-to-provide-the-coordinates'
      }),
      expect.objectContaining({
        method: 'POST',
        path: '/exemption/how-do-you-want-to-provide-the-coordinates'
      }),
      expect.objectContaining({
        method: 'GET',
        path: '/exemption/how-do-you-want-to-enter-the-coordinates'
      }),
      expect.objectContaining({
        method: 'POST',
        path: '/exemption/how-do-you-want-to-enter-the-coordinates'
      }),
      expect.objectContaining({
        method: 'GET',
        path: '/exemption/does-your-project-involve-more-than-one-site'
      }),
      expect.objectContaining({
        method: 'POST',
        path: '/exemption/does-your-project-involve-more-than-one-site'
      }),
      expect.objectContaining({
        method: 'GET',
        path: '/exemption/site-name'
      }),
      expect.objectContaining({
        method: 'POST',
        path: '/exemption/site-name'
      }),
      expect.objectContaining({
        method: 'GET',
        path: '/exemption/same-activity-dates'
      }),
      expect.objectContaining({
        method: 'POST',
        path: '/exemption/same-activity-dates'
      }),
      expect.objectContaining({
        method: 'GET',
        path: '/exemption/same-activity-description'
      }),
      expect.objectContaining({
        method: 'POST',
        path: '/exemption/same-activity-description'
      }),
      expect.objectContaining({
        method: 'GET',
        path: '/exemption/what-coordinate-system'
      }),
      expect.objectContaining({
        method: 'POST',
        path: '/exemption/what-coordinate-system'
      }),
      expect.objectContaining({
        method: 'GET',
        path: '/exemption/enter-the-coordinates-at-the-centre-point'
      }),
      expect.objectContaining({
        method: 'POST',
        path: '/exemption/enter-the-coordinates-at-the-centre-point'
      }),
      expect.objectContaining({
        method: 'GET',
        path: '/exemption/width-of-site'
      }),
      expect.objectContaining({
        method: 'POST',
        path: '/exemption/width-of-site'
      }),
      expect.objectContaining({
        method: 'GET',
        path: '/exemption/enter-multiple-coordinates'
      }),
      expect.objectContaining({
        method: 'POST',
        path: '/exemption/enter-multiple-coordinates'
      }),
      expect.objectContaining({
        method: 'GET',
        path: '/exemption/review-site-details'
      }),
      expect.objectContaining({
        method: 'POST',
        path: '/exemption/review-site-details'
      }),
      expect.objectContaining({
        method: 'GET',
        path: '/exemption/choose-file-type-to-upload'
      }),
      expect.objectContaining({
        method: 'POST',
        path: '/exemption/choose-file-type-to-upload'
      }),
      expect.objectContaining({
        method: 'GET',
        path: '/exemption/upload-file'
      }),
      expect.objectContaining({
        method: 'GET',
        path: '/exemption/upload-and-wait'
      }),
      expect.objectContaining({
        method: 'GET',
        path: '/exemption/site-details'
      }),
      expect.objectContaining({
        method: 'GET',
        path: '/exemption/delete-site'
      }),
      expect.objectContaining({
        method: 'POST',
        path: '/exemption/delete-site'
      }),
      expect.objectContaining({
        method: 'GET',
        path: '/exemption/delete-all-sites'
      }),
      expect.objectContaining({
        method: 'POST',
        path: '/exemption/delete-all-sites'
      }),
      expect.objectContaining({
        method: 'GET',
        path: '/exemption/activity-dates'
      }),
      expect.objectContaining({
        method: 'POST',
        path: '/exemption/activity-dates'
      }),
      expect.objectContaining({
        method: 'GET',
        path: '/exemption/activity-description'
      }),
      expect.objectContaining({
        method: 'POST',
        path: '/exemption/activity-description'
      }),
      expect.objectContaining({
        method: 'GET',
        path: '/exemption/check-your-answers'
      }),
      expect.objectContaining({
        method: 'POST',
        path: '/exemption/check-your-answers'
      }),
      expect.objectContaining({
        method: 'GET',
        path: '/exemption/view-details/{exemptionId}'
      }),
      expect.objectContaining({
        method: 'GET',
        path: '/view-details/{exemptionId}'
      }),
      expect.objectContaining({
        method: 'GET',
        options: {
          auth: false
        },
        path: '/exemption/view-public-details/{exemptionId}'
      }),
      expect.objectContaining({
        method: 'GET',
        path: '/exemption/confirmation'
      }),
      expect.objectContaining({
        method: 'GET',
        path: '/projects'
      }),
      expect.objectContaining({
        method: 'POST',
        path: '/projects'
      }),
      expect.objectContaining({
        method: 'GET',
        path: '/exemption/delete'
      }),
      expect.objectContaining({
        method: 'GET',
        path: '/exemption/delete/{exemptionId}'
      }),
      expect.objectContaining({
        method: 'POST',
        path: '/exemption/delete'
      }),
      expect.objectContaining({
        method: 'GET',
        path: '/exemption/withdraw'
      }),
      expect.objectContaining({
        method: 'GET',
        path: '/exemption/withdraw/{exemptionId}'
      }),
      expect.objectContaining({
        method: 'POST',
        path: '/exemption/withdraw'
      })
    ])
  })

  test('GET /exemption handler should redirect Citizen to confirm-individual', async () => {
    getUserSession.mockResolvedValue({
      userRelationshipType: USER_TYPES.CITIZEN
    })

    const server = {
      route: vi.fn(),
      ext: vi.fn()
    }

    exemption.plugin.register(server)

    const registeredRoutes = server.route.mock.calls[0][0]
    const exemptionRoute = registeredRoutes.find(
      (route) => route.method === 'GET' && route.path === '/exemption'
    )

    const mockRequest = { query: {}, state: { userSession: {} } }
    const mockToolkit = { redirect: vi.fn() }

    await exemptionRoute.handler(mockRequest, mockToolkit)

    expect(getUserSession).toHaveBeenCalledWith(mockRequest, {})
    expect(mockToolkit.redirect).toHaveBeenCalledWith(
      routes.postLogin.CONFIRM_INDIVIDUAL
    )
  })

  test('GET /exemption handler should redirect Employee to correct page', async () => {
    getUserSession.mockResolvedValue({ userRelationshipType: 'Employee' })

    const server = {
      route: vi.fn(),
      ext: vi.fn()
    }

    exemption.plugin.register(server)

    const registeredRoutes = server.route.mock.calls[0][0]
    const exemptionRoute = registeredRoutes.find(
      (route) => route.method === 'GET' && route.path === '/exemption'
    )

    const mockRequest = { query: {}, state: { userSession: {} } }
    const mockToolkit = { redirect: vi.fn() }

    await exemptionRoute.handler(mockRequest, mockToolkit)

    expect(mockToolkit.redirect).toHaveBeenCalledWith(
      routes.postLogin.CONFIRM_EMPLOYEE
    )
  })

  test('GET /exemption handler should redirect Agent to project-name', async () => {
    getUserSession.mockResolvedValue({ userRelationshipType: 'Agent' })

    const server = {
      route: vi.fn(),
      ext: vi.fn()
    }

    exemption.plugin.register(server)

    const registeredRoutes = server.route.mock.calls[0][0]
    const exemptionRoute = registeredRoutes.find(
      (route) => route.method === 'GET' && route.path === '/exemption'
    )

    const mockRequest = { query: {}, state: { userSession: {} } }
    const mockToolkit = { redirect: vi.fn() }

    await exemptionRoute.handler(mockRequest, mockToolkit)

    expect(mockToolkit.redirect).toHaveBeenCalledWith(
      routes.postLogin.CONFIRM_AGENT
    )
  })

  test('GET /exemption handler should redirect unknown user types to skip guidance', async () => {
    getUserSession.mockResolvedValue({ userRelationshipType: 'New Type' })

    const server = {
      route: vi.fn(),
      ext: vi.fn()
    }

    exemption.plugin.register(server)

    const registeredRoutes = server.route.mock.calls[0][0]
    const exemptionRoute = registeredRoutes.find(
      (route) => route.method === 'GET' && route.path === '/exemption'
    )

    const mockRequest = { query: {}, state: { userSession: {} } }
    const mockToolkit = { redirect: vi.fn() }

    await exemptionRoute.handler(mockRequest, mockToolkit)

    expect(mockToolkit.redirect).toHaveBeenCalledWith(routes.PROJECT_NAME)
  })

  test('GET /exemption handler should redirect to sign-in when no session', async () => {
    getUserSession.mockResolvedValue(null)

    const server = {
      route: vi.fn(),
      ext: vi.fn()
    }

    exemption.plugin.register(server)

    const registeredRoutes = server.route.mock.calls[0][0]
    const exemptionRoute = registeredRoutes.find(
      (route) => route.method === 'GET' && route.path === '/exemption'
    )

    const mockRequest = { query: {}, state: {} }
    const mockToolkit = { redirect: vi.fn() }

    await exemptionRoute.handler(mockRequest, mockToolkit)

    expect(mockToolkit.redirect).toHaveBeenCalledWith(routes.SIGNIN)
  })

  test('onPreHandler extension should set commonPageViewData', async () => {
    getPageViewCommonData.mockResolvedValue({
      applicantOrganisationName: 'Test Organisation'
    })

    const server = {
      route: vi.fn(),
      ext: vi.fn()
    }

    exemption.plugin.register(server)

    const onPreHandlerCallback = server.ext.mock.calls.find(
      (call) => call[0] === 'onPreHandler'
    )[1]

    const mockRequest = {
      app: {},
      query: {},
      state: { userSession: 'mockSession' }
    }
    const mockH = { continue: 'continue' }

    const result = await onPreHandlerCallback(mockRequest, mockH)

    expect(getPageViewCommonData).toHaveBeenCalledWith(mockRequest)
    expect(mockRequest.app.commonPageViewData).toEqual({
      applicantOrganisationName: 'Test Organisation'
    })
    expect(result).toBe('continue')
  })

  test('onPreHandler extension should handle no user session', async () => {
    getPageViewCommonData.mockResolvedValue({})

    const server = {
      route: vi.fn(),
      ext: vi.fn()
    }

    exemption.plugin.register(server)

    const onPreHandlerCallback = server.ext.mock.calls.find(
      (call) => call[0] === 'onPreHandler'
    )[1]

    const mockRequest = { app: {}, query: {}, state: {} }
    const mockH = { continue: 'continue' }

    const result = await onPreHandlerCallback(mockRequest, mockH)

    expect(getPageViewCommonData).toHaveBeenCalledWith(mockRequest)
    expect(mockRequest.app.commonPageViewData).toEqual({})
    expect(result).toBe('continue')
  })

  test('onPreResponse extension should merge context for view responses', () => {
    const server = {
      route: vi.fn(),
      ext: vi.fn()
    }

    exemption.plugin.register(server)

    const onPreResponseCallback = server.ext.mock.calls.find(
      (call) => call[0] === 'onPreResponse'
    )[1]

    const mockRequest = { app: { testAppData: 'value' } }
    const mockResponse = {
      variety: 'view',
      source: {
        context: { existingContext: 'data' }
      }
    }
    const mockH = { continue: 'continue' }

    const result = onPreResponseCallback(
      { ...mockRequest, response: mockResponse },
      mockH
    )

    expect(mockResponse.source.context).toEqual({
      testAppData: 'value',
      existingContext: 'data'
    })
    expect(result).toBe('continue')
  })

  test('onPreResponse extension should handle non-view responses', () => {
    const server = {
      route: vi.fn(),
      ext: vi.fn()
    }

    exemption.plugin.register(server)

    const onPreResponseCallback = server.ext.mock.calls.find(
      (call) => call[0] === 'onPreResponse'
    )[1]

    const mockRequest = { app: { testAppData: 'value' } }
    const mockResponse = {
      variety: 'plain',
      source: { context: { existingContext: 'data' } }
    }
    const mockH = { continue: 'continue' }

    const result = onPreResponseCallback(
      { ...mockRequest, response: mockResponse },
      mockH
    )

    expect(result).toBe('continue')
  })
})
