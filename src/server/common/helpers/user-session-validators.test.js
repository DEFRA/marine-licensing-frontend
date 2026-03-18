import { vi } from 'vitest'
import { routes } from '#src/server/common/constants/routes.js'
import {
  agentSession,
  citizenUserSession,
  employeeSession
} from '~/tests/integration/shared/session-fixtures.js'
import { getUserSession } from '~/src/server/common/plugins/auth/utils.js'
import {
  validateAgentUserSession,
  validateEmployeeUserSession,
  validateIndividualUserSession,
  validateTeamAdminSession
} from '#src/server/common/helpers/user-session-validators.js'
import { createMockRequest } from '#src/server/test-helpers/mocks/helpers.js'

vi.mock('~/src/server/common/plugins/auth/utils.js')

describe('#validateAgentUserSession', () => {
  const createMockH = () => ({
    redirect: vi.fn().mockReturnValue({
      takeover: vi.fn().mockReturnValue({})
    }),
    continue: vi.fn()
  })

  beforeEach(() => {
    vi.mocked(getUserSession).mockResolvedValue(agentSession)
  })

  test('redirects to sign-in when userSession does not exist', async () => {
    vi.mocked(getUserSession).mockResolvedValue({})

    const request = createMockRequest()
    const h = createMockH()

    const result = await validateAgentUserSession.method(request, h)

    expect(h.redirect).toHaveBeenCalledWith(routes.SIGNIN)
    expect(result).not.toBe(h.continue)
  })

  test('redirects to correct page when userRelationshipType is not Agent', async () => {
    vi.mocked(getUserSession).mockResolvedValue(employeeSession)

    const request = createMockRequest()
    const h = createMockH()

    const result = await validateAgentUserSession.method(request, h)

    expect(h.redirect).toHaveBeenCalledWith(routes.EXEMPTION)
    expect(result).not.toBe(h.continue)
  })

  test('returns h.continue when userSession is correct', async () => {
    const request = createMockRequest()
    const h = createMockH()

    const result = await validateAgentUserSession.method(request, h)

    expect(h.redirect).not.toHaveBeenCalled()
    expect(result).toBe(h.continue)
  })
})

describe('#validateEmployeeUserSession', () => {
  const createMockH = () => ({
    redirect: vi.fn().mockReturnValue({
      takeover: vi.fn().mockReturnValue({})
    }),
    continue: vi.fn()
  })

  beforeEach(() => {
    vi.mocked(getUserSession).mockResolvedValue(employeeSession)
  })

  test('redirects to sign-in when userSession does not exist', async () => {
    vi.mocked(getUserSession).mockResolvedValue({})

    const request = createMockRequest()
    const h = createMockH()

    const result = await validateEmployeeUserSession.method(request, h)

    expect(h.redirect).toHaveBeenCalledWith(routes.SIGNIN)
    expect(result).not.toBe(h.continue)
  })

  test('redirects to correct page when userRelationshipType is not Employee', async () => {
    vi.mocked(getUserSession).mockResolvedValue(citizenUserSession)

    const request = createMockRequest()
    const h = createMockH()

    const result = await validateEmployeeUserSession.method(request, h)

    expect(h.redirect).toHaveBeenCalledWith(routes.EXEMPTION)
    expect(result).not.toBe(h.continue)
  })

  test('returns h.continue when userSession is correct', async () => {
    const request = createMockRequest()
    const h = createMockH()

    const result = await validateEmployeeUserSession.method(request, h)

    expect(h.redirect).not.toHaveBeenCalled()
    expect(result).toBe(h.continue)
  })
})

describe('#validateTeamAdminSession', () => {
  test('throws Boom forbidden when isTeamAdmin is false', () => {
    const request = createMockRequest({
      auth: { credentials: { isTeamAdmin: false } }
    })

    let error
    try {
      validateTeamAdminSession.method(request)
    } catch (e) {
      error = e
    }

    expect(error.isBoom).toBe(true)
    expect(error.output.statusCode).toBe(403)
  })

  test('throws Boom forbidden when auth credentials are missing', () => {
    const request = createMockRequest()

    let error
    try {
      validateTeamAdminSession.method(request)
    } catch (e) {
      error = e
    }

    expect(error.isBoom).toBe(true)
    expect(error.output.statusCode).toBe(403)
  })

  test('returns null when isTeamAdmin is true', () => {
    const request = createMockRequest({
      auth: { credentials: { isTeamAdmin: true } }
    })

    const result = validateTeamAdminSession.method(request)

    expect(result).toBeNull()
  })
})

describe('#validateIndividualUserSession', () => {
  const createMockH = () => ({
    redirect: vi.fn().mockReturnValue({
      takeover: vi.fn().mockReturnValue({})
    }),
    continue: vi.fn()
  })

  beforeEach(() => {
    vi.mocked(getUserSession).mockResolvedValue(citizenUserSession)
  })

  test('redirects to sign-in when userSession does not exist', async () => {
    vi.mocked(getUserSession).mockResolvedValue({})

    const request = createMockRequest()
    const h = createMockH()

    const result = await validateIndividualUserSession.method(request, h)

    expect(h.redirect).toHaveBeenCalledWith(routes.SIGNIN)
    expect(result).not.toBe(h.continue)
  })

  test('redirects to correct page when userRelationshipType is not Citizen', async () => {
    vi.mocked(getUserSession).mockResolvedValue(employeeSession)

    const request = createMockRequest()
    const h = createMockH()

    const result = await validateIndividualUserSession.method(request, h)

    expect(h.redirect).toHaveBeenCalledWith(routes.EXEMPTION)
    expect(result).not.toBe(h.continue)
  })

  test('returns h.continue when userSession is correct', async () => {
    const request = createMockRequest()
    const h = createMockH()

    const result = await validateIndividualUserSession.method(request, h)

    expect(h.redirect).not.toHaveBeenCalled()
    expect(result).toBe(h.continue)
  })
})
