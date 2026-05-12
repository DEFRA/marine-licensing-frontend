import { describe, expect, it, vi, beforeEach } from 'vitest'

vi.mock('#src/server/common/helpers/authenticated-requests.js', () => ({
  authenticatedGetRequest: vi.fn(),
  authenticatedPostRequest: vi.fn(),
  authenticatedPutRequest: vi.fn(),
  authenticatedRequest: vi.fn()
}))

const {
  authenticatedGetRequest,
  authenticatedPostRequest,
  authenticatedPutRequest,
  authenticatedRequest
} = await import('#src/server/common/helpers/authenticated-requests.js')
const { iatAnswersService } = await import('./iat-answers.service.js')

const request = {}
const body = { outcome: {}, answers: [] }

describe('iatAnswersService', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('create returns the id from the success response', async () => {
    authenticatedPostRequest.mockResolvedValue({
      payload: { message: 'success', value: { id: 'abc' } }
    })
    const id = await iatAnswersService.create(request, body)
    expect(id).toBe('abc')
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
    const id = await iatAnswersService.create(request, body)
    expect(id).toBeNull()
  })

  it('update PUTs to /iat-answers/{id}', async () => {
    authenticatedPutRequest.mockResolvedValue({ payload: {} })
    await iatAnswersService.update(request, 'abc', body)
    expect(authenticatedPutRequest).toHaveBeenCalledWith(
      request,
      '/iat-answers/abc',
      body
    )
  })

  it('delete sends DELETE via the generic helper', async () => {
    authenticatedRequest.mockResolvedValue({ payload: {} })
    await iatAnswersService.delete(request, 'abc')
    expect(authenticatedRequest).toHaveBeenCalledWith(
      request,
      'DELETE',
      '/iat-answers/abc'
    )
  })

  it('get returns the value on success', async () => {
    authenticatedGetRequest.mockResolvedValue({
      payload: { message: 'success', value: { id: 'abc', outcome: {} } },
      res: { statusCode: 200 }
    })
    const doc = await iatAnswersService.get(request, 'abc')
    expect(doc).toEqual({ id: 'abc', outcome: {} })
  })

  it('get returns null on Boom 404', async () => {
    authenticatedGetRequest.mockRejectedValue(
      Object.assign(new Error('Response Error: 404 Not Found'), {
        output: { statusCode: 404 },
        isBoom: true
      })
    )
    const doc = await iatAnswersService.get(request, 'abc')
    expect(doc).toBeNull()
  })

  it('get rethrows non-404 errors', async () => {
    const boom500 = Object.assign(
      new Error('Response Error: 500 Internal Server Error'),
      { output: { statusCode: 500 }, isBoom: true }
    )
    authenticatedGetRequest.mockRejectedValue(boom500)
    await expect(iatAnswersService.get(request, 'abc')).rejects.toBe(boom500)
  })
})
