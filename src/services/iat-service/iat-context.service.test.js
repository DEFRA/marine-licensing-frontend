import { describe, expect, it, vi, beforeEach } from 'vitest'

vi.mock('#src/server/common/helpers/authenticated-requests.js', () => ({
  authenticatedGetRequest: vi.fn(),
  authenticatedPostRequest: vi.fn(),
  authenticatedPatchRequest: vi.fn()
}))

const {
  authenticatedGetRequest,
  authenticatedPostRequest,
  authenticatedPatchRequest
} = await import('#src/server/common/helpers/authenticated-requests.js')
const { iatContextService } = await import('./iat-context.service.js')

const request = {}
const slug = 'AZ4rr6bLclCVUsE2Pl_zKw'

describe('iatContextService', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  describe('create', () => {
    it('posts to /iat-contexts with no body and returns the slug', async () => {
      authenticatedPostRequest.mockResolvedValue({
        payload: { message: 'success', value: { slug } }
      })
      const result = await iatContextService.create(request)
      expect(result).toBe(slug)
      expect(authenticatedPostRequest).toHaveBeenCalledWith(
        request,
        '/iat-contexts'
      )
    })

    it('returns null when slug missing in response', async () => {
      authenticatedPostRequest.mockResolvedValue({
        payload: { message: 'success' }
      })
      const result = await iatContextService.create(request)
      expect(result).toBeNull()
    })
  })

  describe('patch', () => {
    it('patches /iat-contexts/{slug} with { answer } body', async () => {
      authenticatedPatchRequest.mockResolvedValue({})
      const answer = {
        questionRoute: '/q1',
        questionText: 'Q?',
        answerId: 'A',
        answerText: 'A',
        mcmsAppFormMapping: null
      }
      await iatContextService.patch(request, slug, answer)
      expect(authenticatedPatchRequest).toHaveBeenCalledWith(
        request,
        `/iat-contexts/${slug}`,
        { answer }
      )
    })

    it('propagates rejection on non-2xx', async () => {
      const boom400 = Object.assign(
        new Error('Response Error: 400 Bad Request'),
        { output: { statusCode: 400 }, isBoom: true }
      )
      authenticatedPatchRequest.mockRejectedValue(boom400)
      await expect(iatContextService.patch(request, slug, {})).rejects.toBe(
        boom400
      )
    })
  })

  describe('get', () => {
    it('returns the value on success', async () => {
      authenticatedGetRequest.mockResolvedValue({
        payload: { message: 'success', value: { slug, questionLog: [] } }
      })
      const doc = await iatContextService.get(request, slug)
      expect(doc).toEqual({ slug, questionLog: [] })
      expect(authenticatedGetRequest).toHaveBeenCalledWith(
        request,
        `/iat-contexts/${slug}`
      )
    })

    it('returns null when value missing in response', async () => {
      authenticatedGetRequest.mockResolvedValue({
        payload: { message: 'success' }
      })
      const doc = await iatContextService.get(request, slug)
      expect(doc).toBeNull()
    })

    it('returns null on Boom 404', async () => {
      authenticatedGetRequest.mockRejectedValue(
        Object.assign(new Error('Response Error: 404 Not Found'), {
          output: { statusCode: 404 },
          isBoom: true
        })
      )
      const doc = await iatContextService.get(request, slug)
      expect(doc).toBeNull()
    })

    it('rethrows non-404 errors', async () => {
      const boom500 = Object.assign(
        new Error('Response Error: 500 Internal Server Error'),
        { output: { statusCode: 500 }, isBoom: true }
      )
      authenticatedGetRequest.mockRejectedValue(boom500)
      await expect(iatContextService.get(request, slug)).rejects.toBe(boom500)
    })
  })
})
