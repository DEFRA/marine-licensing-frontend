import { describe, it, expect, vi, beforeEach } from 'vitest'
import { iatStartController, iatStartPostController } from './controller.js'
import { iatContextService } from '#src/services/iat-service/iat-context.service.js'

vi.mock('#src/services/iat-service/iat-context.service.js', () => ({
  iatContextService: { create: vi.fn() }
}))

describe('iatStartController GET', () => {
  it('renders the start page view', () => {
    const view = vi.fn()
    iatStartController.handler({}, { view })
    expect(view).toHaveBeenCalledWith(
      'journey/self-service/start/index',
      expect.objectContaining({ pageTitle: expect.any(String) })
    )
  })
})

describe('iatStartPostController', () => {
  let request, h, redirect

  beforeEach(() => {
    vi.clearAllMocks()
    redirect = vi.fn().mockReturnValue('redirected')
    h = { redirect }
    request = {}
  })

  it('creates an iat-context and redirects to the slug-prefixed first question', async () => {
    iatContextService.create.mockResolvedValueOnce('abcdefghijklmnopqrstuv')

    await iatStartPostController.handler(request, h)

    expect(iatContextService.create).toHaveBeenCalledWith(request)
    expect(redirect).toHaveBeenCalledWith(
      expect.stringMatching(
        /^\/journey\/self-service\/c\/abcdefghijklmnopqrstuv\//
      )
    )
  })

  it('throws Boom.badImplementation if create returns no slug', async () => {
    iatContextService.create.mockResolvedValueOnce(null)
    await expect(iatStartPostController.handler(request, h)).rejects.toThrow()
  })
})
