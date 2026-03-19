import { mockRequestAuth } from '#src/server/test-helpers/mocks/auth.js'

export const makeGetRequest = async ({
  url,
  server,
  auth = {},
  headers = {}
}) => {
  return await server.inject({
    auth: { ...mockRequestAuth, ...auth },
    method: 'GET',
    url,
    headers
  })
}

export const makePostRequest = async ({
  url,
  server,
  auth = {},
  formData = {},
  headers = {}
}) => {
  return await server.inject({
    auth: { ...mockRequestAuth, ...auth },
    method: 'POST',
    url,
    payload: formData,
    headers
  })
}
