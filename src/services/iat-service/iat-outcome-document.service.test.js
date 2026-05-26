import { describe, expect, it, vi, beforeEach } from 'vitest'

vi.mock('#src/server/common/helpers/authenticated-requests.js', () => ({
  authenticatedGetRequest: vi.fn(),
  authenticatedPostRequest: vi.fn()
}))

const { authenticatedGetRequest, authenticatedPostRequest } =
  await import('#src/server/common/helpers/authenticated-requests.js')
const { iatOutcomeDocumentService } =
  await import('./iat-outcome-document.service.js')

const request = {}
const contextSlug = 'AZ4rr6bLclCVUsE2Pl_zKw'
const snapSlug = 'B'.repeat(22)

describe('iatOutcomeDocumentService', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  describe('mint', () => {
    it('posts the snapshot payload and returns the full value (slug + viewUrl + snapshot)', async () => {
      const value = {
        slug: snapSlug,
        viewUrl: `/outcome-documents/${snapSlug}`,
        snapshot: { slug: snapSlug, contextSlug }
      }
      authenticatedPostRequest.mockResolvedValue({
        payload: { message: 'success', value }
      })
      const payload = {
        outcomeRoute: '/o',
        outcomeKind: 'terminal-single',
        outcomeHeading: '',
        outcomeText: '',
        focusedOption: {
          id: 'X',
          heading: '',
          text: '',
          module: null,
          link: null,
          overrideCtaButtonUrl: null,
          params: null
        }
      }
      const result = await iatOutcomeDocumentService.mint(
        request,
        contextSlug,
        payload
      )
      expect(result).toEqual(value)
      expect(authenticatedPostRequest).toHaveBeenCalledWith(
        request,
        `/iat-contexts/${contextSlug}/outcome-documents`,
        payload
      )
    })
  })

  describe('get', () => {
    it('returns the value on success', async () => {
      authenticatedGetRequest.mockResolvedValue({
        payload: { message: 'success', value: { slug: snapSlug } }
      })
      const doc = await iatOutcomeDocumentService.get(request, snapSlug)
      expect(doc).toEqual({ slug: snapSlug })
      expect(authenticatedGetRequest).toHaveBeenCalledWith(
        request,
        `/outcome-documents/${snapSlug}`
      )
    })

    it('returns null on Boom 404', async () => {
      authenticatedGetRequest.mockRejectedValue(
        Object.assign(new Error('Response Error: 404 Not Found'), {
          output: { statusCode: 404 },
          isBoom: true
        })
      )
      const doc = await iatOutcomeDocumentService.get(request, snapSlug)
      expect(doc).toBeNull()
    })

    it('rethrows non-404 errors', async () => {
      const boom500 = Object.assign(
        new Error('Response Error: 500 Internal Server Error'),
        { output: { statusCode: 500 }, isBoom: true }
      )
      authenticatedGetRequest.mockRejectedValue(boom500)
      await expect(
        iatOutcomeDocumentService.get(request, snapSlug)
      ).rejects.toBe(boom500)
    })
  })
})
