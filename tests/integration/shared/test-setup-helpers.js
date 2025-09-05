/* eslint-env jest */
import { JSDOM } from 'jsdom'
import { createServer } from '~/src/server/index.js'
import {
  getExemptionCache,
  setExemptionCache
} from '~/src/server/common/helpers/session-cache/utils.js'
import {
  authenticatedPatchRequest,
  authenticatedGetRequest
} from '~/src/server/common/helpers/authenticated-requests.js'

jest.mock('~/src/server/common/helpers/session-cache/utils.js')
jest.mock('~/src/server/common/helpers/authenticated-requests.js')

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

export const setupTestServer = () => {
  let server

  beforeAll(async () => {
    server = await createServer()
    await server.initialize()
  })

  afterAll(async () => {
    await server.stop()
  })

  return () => server
}

export const mockExemption = (mockExemption) => {
  jest.mocked(getExemptionCache).mockReturnValue(mockExemption)
  jest.mocked(setExemptionCache).mockImplementation(() => undefined)
  jest
    .mocked(authenticatedPatchRequest)
    .mockResolvedValue({ payload: { id: mockExemption.id } })

  jest.mocked(authenticatedGetRequest).mockResolvedValue({
    payload: { message: 'success', value: mockExemption }
  })
}
