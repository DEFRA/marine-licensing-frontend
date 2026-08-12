import { vi } from 'vitest'
import { deleteConstructionDrawingsRequest } from '#src/server/common/helpers/marine-licence/construction-drawings-request.js'
import * as authenticatedRequests from '#src/server/common/helpers/authenticated-requests.js'
import { createMockRequest } from '#src/server/test-helpers/mocks/helpers.js'

vi.mock('~/src/server/common/helpers/authenticated-requests.js')

describe('deleteConstructionDrawingsRequest', () => {
  const options = {
    route: '/marine-licence/delete-construction-drawing',
    payload: { id: 'test-id', siteIndex: 0, drawingIndex: 1 },
    logAction: 'marine-licence:delete-construction-drawing-failed',
    reason: 'siteIndex=0 drawingIndex=1',
    errorMessage: 'Error deleting construction drawing'
  }

  it('calls authenticatedPatchRequest with the given route and payload', async () => {
    vi.mocked(
      authenticatedRequests.authenticatedPatchRequest
    ).mockResolvedValue({})
    const request = createMockRequest()

    await deleteConstructionDrawingsRequest(request, options)

    expect(
      authenticatedRequests.authenticatedPatchRequest
    ).toHaveBeenCalledWith(request, options.route, options.payload)
  })

  it('logs and throws a Boom error when the request fails', async () => {
    const apiError = new Error('API error')
    vi.mocked(
      authenticatedRequests.authenticatedPatchRequest
    ).mockRejectedValueOnce(apiError)
    const request = createMockRequest()

    await expect(
      deleteConstructionDrawingsRequest(request, options)
    ).rejects.toThrow('Error deleting construction drawing')

    expect(request.logger.error).toHaveBeenCalledWith(
      {
        err: apiError,
        event: {
          action: options.logAction,
          reference: options.payload.id,
          reason: options.reason
        }
      },
      options.errorMessage
    )
  })
})
