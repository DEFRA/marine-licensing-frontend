import { mockRequestAuth } from '#src/server/test-helpers/mocks/auth.js'

export const makeGetRequest = async ({ url, server, headers = {} }) => {
  return await server.inject({
    auth: mockRequestAuth,
    method: 'GET',
    url,
    headers
  })
}

export const makePostRequest = async ({
  url,
  server,
  formData = {},
  headers = {}
}) => {
  return await server.inject({
    auth: mockRequestAuth,
    method: 'POST',
    url,
    payload: formData,
    headers
  })
}
