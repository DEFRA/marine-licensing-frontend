import { JSDOM } from 'jsdom'

export const submitForm = async ({ requestUrl, server, formData }) => {
  const response = await server.inject({
    method: 'POST',
    url: requestUrl,
    payload: formData
  })
  const { document } = new JSDOM(response.result).window
  return { response, document }
}

export const loadPage = async ({ requestUrl, server }) => {
  const response = await server.inject({
    method: 'GET',
    url: requestUrl
  })

  const { window } = new JSDOM(response.result)
  return window.document
}
