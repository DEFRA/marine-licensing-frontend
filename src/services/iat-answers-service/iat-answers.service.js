import {
  authenticatedGetRequest,
  authenticatedPostRequest,
  authenticatedPutRequest,
  authenticatedRequest
} from '#src/server/common/helpers/authenticated-requests.js'

const PATH = '/iat-answers'

export const iatAnswersService = {
  async create(request, body) {
    const { payload } = await authenticatedPostRequest(request, PATH, body)
    return payload?.value?.id ?? null
  },

  async update(request, id, body) {
    await authenticatedPutRequest(request, `${PATH}/${id}`, body)
  },

  async delete(request, id) {
    await authenticatedRequest(request, 'DELETE', `${PATH}/${id}`)
  },

  async get(request, id) {
    try {
      const { payload } = await authenticatedGetRequest(
        request,
        `${PATH}/${id}`
      )
      return payload?.value ?? null
    } catch (error) {
      if (error?.output?.statusCode === 404) {
        return null
      }
      throw error
    }
  }
}
