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
    const { payload, res } = await authenticatedGetRequest(
      request,
      `${PATH}/${id}`
    )
    if (res?.statusCode === 404) {
      return null
    }
    return payload?.value ?? null
  }
}
