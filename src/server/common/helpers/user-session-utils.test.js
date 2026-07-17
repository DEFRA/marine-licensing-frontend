import { vi } from 'vitest'
import {
  agentSession,
  citizenUserSession,
  employeeSession
} from '~/tests/integration/shared/session-fixtures.js'
import { getUserSession } from '~/src/server/common/plugins/auth/utils.js'
import { isIndividualUser } from '#src/server/common/helpers/user-session-utils.js'
import { createMockRequest } from '#src/server/test-helpers/mocks/helpers.js'

vi.mock('~/src/server/common/plugins/auth/utils.js')

describe('#isIndividualUser', () => {
  test('returns true when the user is a citizen', async () => {
    vi.mocked(getUserSession).mockResolvedValue(citizenUserSession)

    const result = await isIndividualUser(createMockRequest())

    expect(result).toBe(true)
  })

  test('returns false when the user is an agent', async () => {
    vi.mocked(getUserSession).mockResolvedValue(agentSession)

    const result = await isIndividualUser(createMockRequest())

    expect(result).toBe(false)
  })

  test('returns false when the user is an employee', async () => {
    vi.mocked(getUserSession).mockResolvedValue(employeeSession)

    const result = await isIndividualUser(createMockRequest())

    expect(result).toBe(false)
  })
})
