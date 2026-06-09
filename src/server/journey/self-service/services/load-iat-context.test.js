import { describe, it, expect, beforeEach, vi } from 'vitest'
import { loadIatContext } from './load-iat-context.js'
import { iatContextService } from '#src/services/iat-service/iat-context.service.js'
import { routes } from '#src/server/common/constants/routes.js'

vi.mock('#src/services/iat-service/iat-context.service.js', () => ({
  iatContextService: { get: vi.fn() }
}))

describe('loadIatContext', () => {
  let request, h, takeover, redirect

  beforeEach(() => {
    vi.clearAllMocks()
    takeover = vi.fn().mockReturnValue('redirected-takeover')
    redirect = vi.fn(() => ({ takeover }))
    request = {
      params: { slug: 'abcdefghijklmnopqrstuv' },
      app: {},
      logger: { warn: vi.fn() }
    }
    h = {
      redirect,
      continue: Symbol('continue')
    }
  })

  it('stashes the doc on request.app.iatDoc and returns h.continue on success', async () => {
    const doc = { slug: request.params.slug, questionLog: [] }
    iatContextService.get.mockResolvedValueOnce(doc)

    const result = await loadIatContext.method(request, h)
    expect(iatContextService.get).toHaveBeenCalledWith(
      request,
      request.params.slug
    )
    expect(request.app.iatDoc).toBe(doc)
    expect(result).toBe(h.continue)
  })

  it('redirects to IAT_INVALID if the doc is not found', async () => {
    iatContextService.get.mockResolvedValueOnce(null)
    await loadIatContext.method(request, h)
    expect(h.redirect).toHaveBeenCalledWith(routes.IAT_INVALID)
    expect(takeover).toHaveBeenCalled()
  })

  it('logs an event.action when redirecting to invalid (slug in event.reference)', async () => {
    iatContextService.get.mockResolvedValueOnce(null)
    await loadIatContext.method(request, h)
    expect(request.logger.warn).toHaveBeenCalledWith(
      expect.objectContaining({
        event: expect.objectContaining({
          action: 'iat:invalid-context',
          reference: request.params.slug
        })
      }),
      expect.any(String)
    )
  })
})
