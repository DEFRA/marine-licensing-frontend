import { describe, expect, it, vi, beforeEach } from 'vitest'

vi.mock('#src/server/common/helpers/authenticated-requests.js', () => ({
  authenticatedGetRequest: vi.fn(),
  authenticatedPostRequest: vi.fn(),
  authenticatedPatchRequest: vi.fn(),
  authenticatedPutRequest: vi.fn()
}))

const {
  authenticatedGetRequest,
  authenticatedPostRequest,
  authenticatedPatchRequest
} = await import('#src/server/common/helpers/authenticated-requests.js')
const { iatAnswersService } = await import('./iat-answers.service.js')

const request = {}
const slug = 'AZ4rr6bLclCVUsE2Pl_zKw'

describe('iatAnswersService', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  describe('create', () => {
    it('posts to /iat-answers with no body and returns the slug', async () => {
      authenticatedPostRequest.mockResolvedValue({
        payload: { message: 'success', value: { slug } }
      })
      const result = await iatAnswersService.create(request)
      expect(result).toBe(slug)
      expect(authenticatedPostRequest).toHaveBeenCalledWith(
        request,
        '/iat-answers'
      )
    })

    it('returns null when the response is malformed (missing slug)', async () => {
      authenticatedPostRequest.mockResolvedValue({
        payload: { message: 'success' }
      })
      const result = await iatAnswersService.create(request)
      expect(result).toBeNull()
    })
  })

  describe('patch', () => {
    it('patches /iat-answers/{slug} with the supplied body', async () => {
      authenticatedPatchRequest.mockResolvedValue({})
      const body = { outcome: {}, answers: [] }
      await iatAnswersService.patch(request, slug, body)
      expect(authenticatedPatchRequest).toHaveBeenCalledWith(
        request,
        `/iat-answers/${slug}`,
        body
      )
    })

    it('propagates rejection on non-2xx', async () => {
      const boom400 = Object.assign(
        new Error('Response Error: 400 Bad Request'),
        { output: { statusCode: 400 }, isBoom: true }
      )
      authenticatedPatchRequest.mockRejectedValue(boom400)
      await expect(
        iatAnswersService.patch(request, slug, {})
      ).rejects.toBe(boom400)
    })
  })

  describe('publish', () => {
    it('posts to /iat-answers/{slug}/publish with no body', async () => {
      authenticatedPostRequest.mockResolvedValue({})
      await iatAnswersService.publish(request, slug)
      expect(authenticatedPostRequest).toHaveBeenCalledWith(
        request,
        `/iat-answers/${slug}/publish`
      )
    })

    it('propagates rejection on non-2xx', async () => {
      const boom500 = Object.assign(
        new Error('Response Error: 500 Internal Server Error'),
        { output: { statusCode: 500 }, isBoom: true }
      )
      authenticatedPostRequest.mockRejectedValue(boom500)
      await expect(
        iatAnswersService.publish(request, slug)
      ).rejects.toBe(boom500)
    })
  })

  describe('get', () => {
    it('returns the value on success', async () => {
      authenticatedGetRequest.mockResolvedValue({
        payload: {
          message: 'success',
          value: { slug, outcome: {} }
        },
        res: { statusCode: 200 }
      })
      const doc = await iatAnswersService.get(request, slug)
      expect(doc).toEqual({ slug, outcome: {} })
      expect(authenticatedGetRequest).toHaveBeenCalledWith(
        request,
        `/iat-answers/${slug}`
      )
    })

    it('returns null on Boom 404', async () => {
      authenticatedGetRequest.mockRejectedValue(
        Object.assign(new Error('Response Error: 404 Not Found'), {
          output: { statusCode: 404 },
          isBoom: true
        })
      )
      const doc = await iatAnswersService.get(request, slug)
      expect(doc).toBeNull()
    })

    it('rethrows non-404 errors', async () => {
      const boom500 = Object.assign(
        new Error('Response Error: 500 Internal Server Error'),
        { output: { statusCode: 500 }, isBoom: true }
      )
      authenticatedGetRequest.mockRejectedValue(boom500)
      await expect(iatAnswersService.get(request, slug)).rejects.toBe(boom500)
    })
  })
})
