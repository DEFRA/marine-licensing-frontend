import { defraIdGuidanceUserSession } from '#src/server/common/helpers/defraid-guidance/session-cache.js'

describe('Session cache for Defra ID guidance', () => {
  let request

  beforeEach(() => {
    request = {
      yar: {
        set: vi.fn(),
        commit: vi.fn(),
        get: vi.fn()
      }
    }
  })

  describe('set', () => {
    it('saves the provided value', async () => {
      await defraIdGuidanceUserSession.set({
        request,
        key: 'checkSetupEmployee',
        value: 'register-new'
      })
      expect(request.yar.set).toHaveBeenCalledWith('defraIdGuidance', {
        checkSetupEmployee: 'register-new'
      })
    })

    it('merges the new property with any existing object in the cache', async () => {
      request.yar.get.mockResolvedValue({ existingKey: 'existingValue' })
      await defraIdGuidanceUserSession.set({
        request,
        key: 'checkSetupEmployee',
        value: 'register-new'
      })
      expect(request.yar.set).toHaveBeenCalledWith('defraIdGuidance', {
        existingKey: 'existingValue',
        checkSetupEmployee: 'register-new'
      })
    })
  })

  describe('get', () => {
    it('returns the cached value for the specified key', async () => {
      request.yar.get.mockResolvedValue({
        checkSetupEmployee: 'existingValue',
        otherKey: 'otherValue'
      })
      const value = await defraIdGuidanceUserSession.get({
        request,
        key: 'checkSetupEmployee'
      })
      expect(value).toEqual('existingValue')
    })
  })
})
