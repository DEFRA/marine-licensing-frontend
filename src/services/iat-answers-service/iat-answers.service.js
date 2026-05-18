import {
  authenticatedGetRequest,
  authenticatedPostRequest
} from '#src/server/common/helpers/authenticated-requests.js'
import { statusCodes } from '#src/server/common/constants/status-codes.js'

const PATH = '/iat-answers'

export const iatAnswersService = {
  async create(request, body) {
    const { payload } = await authenticatedPostRequest(request, PATH, body)
    return payload?.value?.slug ?? null
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
