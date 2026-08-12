import Boom from '@hapi/boom'
import { authenticatedPatchRequest } from '#src/server/common/helpers/authenticated-requests.js'

export const deleteConstructionDrawingsRequest = async (
  request,
  { route, payload, logAction, reason, errorMessage }
) => {
  try {
    await authenticatedPatchRequest(request, route, payload)
  } catch (error) {
    request.logger.error(
      {
        err: error,
        event: {
          action: logAction,
          reference: payload.id,
          reason
        }
      },
      errorMessage
    )
    throw Boom.internal(errorMessage)
  }
}
