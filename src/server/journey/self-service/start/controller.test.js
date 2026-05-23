import { describe, it, expect, vi, beforeEach } from 'vitest'
import { iatStartController, iatStartPostController } from './controller.js'
import { iatAnswersService } from '#src/services/iat-answers-service/iat-answers.service.js'

vi.mock('#src/services/iat-answers-service/iat-answers.service.js', () => ({
  iatAnswersService: { create: vi.fn() }
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

  it('creates an iat-answers doc and redirects to the slug-prefixed first question', async () => {
    iatAnswersService.create.mockResolvedValueOnce('abcdefghijklmnopqrstuv')

    await iatStartPostController.handler(request, h)

    expect(iatAnswersService.create).toHaveBeenCalledWith(request)
    expect(redirect).toHaveBeenCalledWith(
      expect.stringMatching(
        /^\/journey\/self-service\/c\/abcdefghijklmnopqrstuv\//
      )
    )
  })

  it('throws Boom.badImplementation if create returns no slug', async () => {
    iatAnswersService.create.mockResolvedValueOnce(null)
    await expect(iatStartPostController.handler(request, h)).rejects.toThrow()
  })
})
