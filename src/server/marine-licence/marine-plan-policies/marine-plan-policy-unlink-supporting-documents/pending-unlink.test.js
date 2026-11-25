import {
  clearPendingUnlink,
  getPendingUnlink,
  setPendingUnlink
} from '#src/server/marine-licence/marine-plan-policies/marine-plan-policy-unlink-supporting-documents/pending-unlink.js'
import { createMockRequest } from '#src/server/test-helpers/mocks/helpers.js'

const KEY = 'marinePlanPolicyUnlinkPayload'

const pendingUnlink = {
  body: { id: 'lic-1', policyCode: 'ABC-123' },
  filenames: ['a.pdf']
}

describe('pending-unlink', () => {
  test('set stores the value in the session', () => {
    const request = createMockRequest()

    setPendingUnlink(request, pendingUnlink)

    expect(request.yar.set).toHaveBeenCalledWith(KEY, pendingUnlink)
  })

  test('get returns the stored value for the matching policy', () => {
    const request = createMockRequest()
    request.yar.get.mockReturnValue(pendingUnlink)

    expect(getPendingUnlink(request, 'ABC-123')).toEqual(pendingUnlink)
    expect(request.yar.get).toHaveBeenCalledWith(KEY)
  })

  test.each([
    ['a different policy', pendingUnlink, 'OTHER-1'],
    ['nothing stored', null, 'ABC-123']
  ])('get returns null for %s', (_, stored, policyCode) => {
    const request = createMockRequest()
    request.yar.get.mockReturnValue(stored)

    expect(getPendingUnlink(request, policyCode)).toBeNull()
  })

  test('clear removes the stored value', () => {
    const request = createMockRequest()

    clearPendingUnlink(request)

    expect(request.yar.clear).toHaveBeenCalledWith(KEY)
  })

  test('clear does nothing when there is no session', () => {
    expect(() => clearPendingUnlink({})).not.toThrow()
  })
})
