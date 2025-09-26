import { getPageViewCommonData } from './page-view-common-data.js'
import { getUserSession } from '~/src/server/common/plugins/auth/utils.js'

jest.mock('~/src/server/common/plugins/auth/utils.js', () => ({
  getUserSession: jest.fn()
}))

describe('getPageViewCommonData', () => {
  const mockGetUserSession = jest.mocked(getUserSession)

  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('should return empty object when no user session exists', async () => {
    mockGetUserSession.mockResolvedValue(null)

    const mockRequest = {
      state: { userSession: 'mock-session' }
    }

    const result = await getPageViewCommonData(mockRequest)

    expect(result).toEqual({})
    expect(mockGetUserSession).toHaveBeenCalledWith(mockRequest, 'mock-session')
  })

  test('should return applicantOrganisationName when user session exists', async () => {
    const mockUserSession = {
      applicantOrganisationName: 'Test Organisation Ltd'
    }
    mockGetUserSession.mockResolvedValue(mockUserSession)

    const mockRequest = {
      state: { userSession: 'mock-session' }
    }

    const result = await getPageViewCommonData(mockRequest)

    expect(result).toEqual({
      applicantOrganisationName: 'Test Organisation Ltd'
    })
    expect(mockGetUserSession).toHaveBeenCalledWith(mockRequest, 'mock-session')
  })

  test('should handle request without userSession state', async () => {
    mockGetUserSession.mockResolvedValue(null)

    const mockRequest = {
      state: {}
    }

    const result = await getPageViewCommonData(mockRequest)

    expect(result).toEqual({})
    expect(mockGetUserSession).toHaveBeenCalledWith(mockRequest, undefined)
  })

  test('should handle request without state property', async () => {
    mockGetUserSession.mockResolvedValue(null)

    const mockRequest = {}

    const result = await getPageViewCommonData(mockRequest)

    expect(result).toEqual({})
    expect(mockGetUserSession).toHaveBeenCalledWith(mockRequest, undefined)
  })
})
