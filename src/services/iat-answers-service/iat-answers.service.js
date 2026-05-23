import {
  authenticatedGetRequest,
  authenticatedPostRequest,
  authenticatedPatchRequest
} from '#src/server/common/helpers/authenticated-requests.js'
import { statusCodes } from '#src/server/common/constants/status-codes.js'

const PATH = '/iat-answers'

export const iatAnswersService = {
  async create(request) {
    const { payload } = await authenticatedPostRequest(request, PATH)
    return payload?.value?.slug ?? null
  },

  async patch(request, slug, body) {
    await authenticatedPatchRequest(request, `${PATH}/${slug}`, body)
  },

  async publish(request, slug) {
    await authenticatedPostRequest(request, `${PATH}/${slug}/publish`)
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
