import { describe, expect, it, vi, beforeEach } from 'vitest'

vi.mock('#src/server/common/helpers/authenticated-requests.js', () => ({
  authenticatedGetRequest: vi.fn(),
  authenticatedPostRequest: vi.fn()
}))

const { authenticatedGetRequest, authenticatedPostRequest } =
  await import('#src/server/common/helpers/authenticated-requests.js')
const { iatAnswersService } = await import('./iat-answers.service.js')

const request = {}
const body = { outcome: {}, answers: [] }

describe('iatAnswersService', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('create returns the slug from the success response', async () => {
    authenticatedPostRequest.mockResolvedValue({
      payload: { message: 'success', value: { slug: 'AZ4rr6bLclCVUsE2Pl_zKw' } }
    })
    const slug = await iatAnswersService.create(request, body)
    expect(slug).toBe('AZ4rr6bLclCVUsE2Pl_zKw')
    expect(authenticatedPostRequest).toHaveBeenCalledWith(
      request,
      '/iat-answers',
      body
    )
  })

  it('create returns null when value is missing', async () => {
    authenticatedPostRequest.mockResolvedValue({
      payload: { message: 'success' }
    })
    const slug = await iatAnswersService.create(request, body)
    expect(slug).toBeNull()
  })

  it('get returns the value on success', async () => {
    authenticatedGetRequest.mockResolvedValue({
      payload: {
        message: 'success',
        value: { slug: 'AZ4rr6bLclCVUsE2Pl_zKw', outcome: {} }
      },
      res: { statusCode: 200 }
    })
    const doc = await iatAnswersService.get(request, 'AZ4rr6bLclCVUsE2Pl_zKw')
    expect(doc).toEqual({ slug: 'AZ4rr6bLclCVUsE2Pl_zKw', outcome: {} })
    expect(authenticatedGetRequest).toHaveBeenCalledWith(
      request,
      '/iat-answers/AZ4rr6bLclCVUsE2Pl_zKw'
    )
  })

  it('get returns null on Boom 404', async () => {
    authenticatedGetRequest.mockRejectedValue(
      Object.assign(new Error('Response Error: 404 Not Found'), {
        output: { statusCode: 404 },
        isBoom: true
      })
    )
    const doc = await iatAnswersService.get(request, 'AZ4rr6bLclCVUsE2Pl_zKw')
    expect(doc).toBeNull()
  })

  it('get rethrows non-404 errors', async () => {
    const boom500 = Object.assign(
      new Error('Response Error: 500 Internal Server Error'),
      { output: { statusCode: 500 }, isBoom: true }
    )
    authenticatedGetRequest.mockRejectedValue(boom500)
    await expect(
      iatAnswersService.get(request, 'AZ4rr6bLclCVUsE2Pl_zKw')
    ).rejects.toBe(boom500)
  })
})
