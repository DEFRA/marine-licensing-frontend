import { getPageViewCommonData } from './page-view-common-data.js'
import { getUserSession } from '#src/server/common/plugins/auth/utils.js'
import { routes } from '#src/server/common/constants/routes.js'

vi.mock('~/src/server/common/plugins/auth/utils.js', () => ({
  getUserSession: vi.fn()
}))

describe('getPageViewCommonData', () => {
  const mockGetUserSession = vi.mocked(getUserSession)

  test('should return empty object when no user session exists', async () => {
    mockGetUserSession.mockResolvedValue(null)

    const mockRequest = {
      state: { userSession: 'mock-session' }
    }

    const result = await getPageViewCommonData(mockRequest)

    expect(result).toEqual({})
  })

  test('should return showChangeOrganisationLink false when not on dashboard page', async () => {
    const mockUserSession = {
      organisationName: 'Test Organisation Ltd',
      hasMultipleOrganisations: false
    }
    mockGetUserSession.mockResolvedValue(mockUserSession)

    const mockRequest = {
      state: { userSession: 'mock-session' },
      path: routes.TASK_LIST
    }

    const result = await getPageViewCommonData(mockRequest)

    expect(result.showChangeOrganisationLink).toEqual(false)
  })

  test('should return showChangeOrganisationLink false when user has single organisation on dashboard', async () => {
    const mockUserSession = {
      organisationName: 'Test Organisation Ltd',
      hasMultipleOrganisations: false
    }
    mockGetUserSession.mockResolvedValue(mockUserSession)

    const mockRequest = {
      state: { userSession: 'mock-session' },
      path: routes.DASHBOARD
    }

    const result = await getPageViewCommonData(mockRequest)

    expect(result.showChangeOrganisationLink).toEqual(false)
  })

  test('should return showChangeOrganisationLink true when user has multiple organisations on dashboard', async () => {
    const mockUserSession = {
      organisationName: 'Test Organisation Ltd',
      hasMultipleOrganisations: true
    }
    mockGetUserSession.mockResolvedValue(mockUserSession)

    const mockRequest = {
      state: { userSession: 'mock-session' },
      path: routes.DASHBOARD
    }

    const result = await getPageViewCommonData(mockRequest)

    expect(result.showChangeOrganisationLink).toEqual(true)
  })

  test('should return showChangeOrganisationLink false when user has multiple organisations but not on dashboard', async () => {
    const mockUserSession = {
      organisationName: 'Test Organisation Ltd',
      hasMultipleOrganisations: true
    }
    mockGetUserSession.mockResolvedValue(mockUserSession)

    const mockRequest = {
      state: { userSession: 'mock-session' },
      path: '/exemption/task-list'
    }

    const result = await getPageViewCommonData(mockRequest)

    expect(result).toEqual({
      orgOrUserName: 'Test Organisation Ltd',
      showChangeOrganisationLink: false
    })
  })

  test('should handle request without userSession state', async () => {
    mockGetUserSession.mockResolvedValue(null)

    const mockRequest = {
      state: {}
    }

    const result = await getPageViewCommonData(mockRequest)

    expect(result).toEqual({})
  })

  test('should handle request without state property', async () => {
    mockGetUserSession.mockResolvedValue(null)

    const mockRequest = {}

    const result = await getPageViewCommonData(mockRequest)

    expect(result).toEqual({})
  })

  test("should return orgOrUserName set to organisationName when it's set and user has multiple organisations", async () => {
    const mockUserSession = {
      organisationName: 'Test Organisation Ltd',
      displayName: 'John Doe',
      hasMultipleOrganisations: true
    }
    mockGetUserSession.mockResolvedValue(mockUserSession)

    const mockRequest = {
      state: { userSession: 'mock-session' },
      path: routes.DASHBOARD
    }

    const result = await getPageViewCommonData(mockRequest)

    expect(result.orgOrUserName).toEqual('Test Organisation Ltd')
  })

  test('should return orgOrUserName with displayName when user has multiple organisations but no organisationName', async () => {
    const mockUserSession = {
      organisationName: null,
      displayName: 'John Doe',
      hasMultipleOrganisations: true
    }
    mockGetUserSession.mockResolvedValue(mockUserSession)

    const mockRequest = {
      state: { userSession: 'mock-session' },
      path: routes.DASHBOARD
    }

    const result = await getPageViewCommonData(mockRequest)

    expect(result.orgOrUserName).toEqual('John Doe')
  })

  test('should return orgOrUserName as null when user has single organisation', async () => {
    const mockUserSession = {
      organisationName: 'Test Organisation Ltd',
      displayName: 'John Doe',
      hasMultipleOrganisations: false
    }
    mockGetUserSession.mockResolvedValue(mockUserSession)

    const mockRequest = {
      state: { userSession: 'mock-session' },
      path: routes.DASHBOARD
    }

    const result = await getPageViewCommonData(mockRequest)

    expect(result.orgOrUserName).toEqual(null)
  })
})
