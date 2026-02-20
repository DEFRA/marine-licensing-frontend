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

  test('should return showChangeOrganisationLink false for correct pages', async () => {
    const mockUserSession = {
      organisationName: 'Test Organisation Ltd',
      hasMultipleOrgPickerEntries: false
    }
    mockGetUserSession.mockResolvedValue(mockUserSession)

    const mockRequestDashboardPage = {
      state: { userSession: 'mock-session' },
      path: routes.TASK_LIST
    }

    const resultDashboard = await getPageViewCommonData(
      mockRequestDashboardPage
    )

    expect(resultDashboard.showChangeOrganisationLink).toEqual(false)

    const mockRequestHomePage = {
      state: { userSession: 'mock-session' },
      path: routes.SERVICE_HOME
    }

    const resultHomePage = await getPageViewCommonData(mockRequestHomePage)

    expect(resultHomePage.showChangeOrganisationLink).toEqual(false)
  })

  test('should return showChangeOrganisationLink false when user has single organisation on dashboard', async () => {
    const mockUserSession = {
      organisationName: 'Test Organisation Ltd',
      hasMultipleOrgPickerEntries: false
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
      hasMultipleOrgPickerEntries: true
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
      hasMultipleOrgPickerEntries: true,
      shouldShowOrgOrUserName: true
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
      hasMultipleOrgPickerEntries: true,
      shouldShowOrgOrUserName: true
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
      hasMultipleOrgPickerEntries: true,
      shouldShowOrgOrUserName: true
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
      hasMultipleOrgPickerEntries: false
    }
    mockGetUserSession.mockResolvedValue(mockUserSession)

    const mockRequest = {
      state: { userSession: 'mock-session' },
      path: routes.DASHBOARD
    }

    const result = await getPageViewCommonData(mockRequest)

    expect(result.orgOrUserName).toEqual(null)
  })

  test('should return orgOrUserName as null when shouldShowOrgOrUserName is false', async () => {
    const mockUserSession = {
      organisationName: 'Test Organisation Ltd',
      displayName: 'John Doe',
      hasMultipleOrgPickerEntries: false,
      shouldShowOrgOrUserName: false
    }
    mockGetUserSession.mockResolvedValue(mockUserSession)

    const mockRequest = {
      state: { userSession: 'mock-session' },
      path: routes.DASHBOARD
    }

    const result = await getPageViewCommonData(mockRequest)

    expect(result.orgOrUserName).toEqual(null)
  })

  test('should return orgOrUserName as null when shouldShowOrgOrUserName is false but user has multiple organisations', async () => {
    const mockUserSession = {
      organisationName: 'Test Organisation Ltd',
      displayName: 'John Doe',
      hasMultipleOrgPickerEntries: true,
      shouldShowOrgOrUserName: false
    }
    mockGetUserSession.mockResolvedValue(mockUserSession)

    const mockRequest = {
      state: { userSession: 'mock-session' },
      path: routes.DASHBOARD
    }

    const result = await getPageViewCommonData(mockRequest)

    expect(result).toEqual({
      orgOrUserName: null,
      showChangeOrganisationLink: true
    })
  })

  test('should return orgOrUserName with organisationName when shouldShowOrgOrUserName is true and organisationName exists', async () => {
    const mockUserSession = {
      organisationName: 'Test Organisation Ltd',
      displayName: 'John Doe',
      hasMultipleOrgPickerEntries: true,
      shouldShowOrgOrUserName: true
    }
    mockGetUserSession.mockResolvedValue(mockUserSession)

    const mockRequest = {
      state: { userSession: 'mock-session' },
      path: '/other-route'
    }

    const result = await getPageViewCommonData(mockRequest)

    expect(result).toEqual({
      orgOrUserName: 'Test Organisation Ltd',
      showChangeOrganisationLink: false
    })
  })

  test('should return orgOrUserName with displayName when shouldShowOrgOrUserName is true but organisationName is empty', async () => {
    const mockUserSession = {
      organisationName: '',
      displayName: 'Jane Smith',
      hasMultipleOrgPickerEntries: false,
      shouldShowOrgOrUserName: true
    }
    mockGetUserSession.mockResolvedValue(mockUserSession)

    const mockRequest = {
      state: { userSession: 'mock-session' },
      path: '/some-page'
    }

    const result = await getPageViewCommonData(mockRequest)

    expect(result.orgOrUserName).toEqual('Jane Smith')
  })

  test('should return orgOrUserName as null when shouldShowOrgOrUserName is false and both organisationName and displayName are empty', async () => {
    const mockUserSession = {
      organisationName: '',
      displayName: '',
      hasMultipleOrgPickerEntries: false,
      shouldShowOrgOrUserName: false
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
