import {
  authenticatedGetRequest,
  authenticatedPostRequest,
  authenticatedPatchRequest
} from '#src/server/common/helpers/authenticated-requests.js'
import { statusCodes } from '#src/server/common/constants/status-codes.js'

const PATH = '/iat-contexts'

export const iatContextService = {
  async create(request) {
    const { payload } = await authenticatedPostRequest(request, PATH)
    return payload?.value?.slug ?? null
  },

  async patch(request, slug, answer) {
    await authenticatedPatchRequest(request, `${PATH}/${slug}`, { answer })
  },

  async get(request, slug) {
    try {
      const { payload } = await authenticatedGetRequest(
        request,
        `${PATH}/${slug}`
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
