import { JSDOM } from 'jsdom'
import {
  makeGetRequest,
  makePostRequest
} from '~/src/server/test-helpers/server-requests.js'

export const submitForm = async ({ requestUrl, server, formData }) => {
  const response = await makePostRequest({ url: requestUrl, server, formData })
  const { document } = new JSDOM(response.result).window
  return { response, document }
}

export const loadPage = async ({ requestUrl, server }) => {
  const response = await makeGetRequest({ url: requestUrl, server })
  const { window } = new JSDOM(response.result)
  return window.document
}
