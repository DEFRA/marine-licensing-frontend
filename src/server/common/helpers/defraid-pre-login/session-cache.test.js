import { preloginUserSession } from '#src/server/common/helpers/defraid-pre-login/session-cache.js'

describe('Session cache for Defra ID pre-login', () => {
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
      await preloginUserSession.set({
        request,
        key: 'checkSetupEmployee',
        value: 'register-new'
      })
      expect(request.yar.set).toHaveBeenCalledWith('defraIdPreLogin', {
        checkSetupEmployee: 'register-new'
      })
    })

    it('merges the new property with any existing object in the cache', async () => {
      request.yar.get.mockResolvedValue({ existingKey: 'existingValue' })
      await preloginUserSession.set({
        request,
        key: 'checkSetupEmployee',
        value: 'register-new'
      })
      expect(request.yar.set).toHaveBeenCalledWith('defraIdPreLogin', {
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
      const value = await preloginUserSession.get({
        request,
        key: 'checkSetupEmployee'
      })
      expect(value).toEqual('existingValue')
    })
  })
})
