import {
  authenticatedGetRequest,
  authenticatedPostRequest
} from '#src/server/common/helpers/authenticated-requests.js'
import { statusCodes } from '#src/server/common/constants/status-codes.js'

export const iatOutcomeDocumentService = {
  async mint(request, contextSlug, payload) {
    const { payload: response } = await authenticatedPostRequest(
      request,
      `/iat-contexts/${contextSlug}/outcome-documents`,
      payload
    )
    return response?.value ?? null
  },

  async get(request, slug) {
    try {
      const { payload } = await authenticatedGetRequest(
        request,
        `/outcome-documents/${slug}`
      )
      return payload?.value ?? null
    } catch (error) {
      if (error?.output?.statusCode === statusCodes.notFound) {
        return null
      }
      throw error
    }
  }
}
