/* eslint-env jest */
import { JSDOM } from 'jsdom'
import { createServer } from '~/src/server/index.js'

export const createTestServer = () => {
  let server

  const setup = async () => {
    server = await createServer()
    await server.initialize()
    return server
  }

  const teardown = async () => {
    if (server) {
      await server.stop()
    }
  }

  const getServer = () => server

  return { setup, teardown, getServer }
}

export const responseToDocument = (response) => {
  return new JSDOM(response.result).window.document
}

export const validateResponse = (response, expectedStatus = 200) => {
  expect(response.statusCode).toBe(expectedStatus)
}
