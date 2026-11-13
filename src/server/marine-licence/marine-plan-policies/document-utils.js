import Boom from '@hapi/boom'
import { getMarineLicenceCache } from '#src/server/common/helpers/marine-licence/session-cache/utils.js'
import { getMarineLicenceService } from '#src/services/marine-licence-service/index.js'

export const loadMarinePlanPolicyDocument = async (request) => {
  const cached = getMarineLicenceCache(request)

  if (!cached?.id) {
    throw Boom.notFound('Marine licence not found')
  }

  const { id, projectName } = cached
  const { documentId } = request.params
  const marineLicence =
    await getMarineLicenceService(request).getMarineLicenceById(id)

  const document =
    marineLicence.marinePlanPolicySupportingDocuments?.documents?.find(
      (item) => item.documentId === documentId
    )

  if (!document) {
    throw Boom.notFound('Marine plan policy supporting document not found')
  }

  return { id, documentId, projectName, document, marineLicence }
}
