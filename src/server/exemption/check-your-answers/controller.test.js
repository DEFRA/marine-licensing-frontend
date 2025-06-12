import { JSDOM } from 'jsdom'
import Wreck from '@hapi/wreck'

import * as cacheUtils from '~/src/server/common/helpers/session-cache/utils.js'
import { createServer } from '~/src/server/index.js'
import { mockExemption } from '~/src/server/test-helpers/mocks.js'

describe('check your answers controller', () => {
  let server
  let getExemptionCacheSpy

  beforeAll(async () => {
    server = await createServer()
    await server.initialize()
  })

  beforeEach(() => {
    jest.resetAllMocks()

    jest
      .spyOn(Wreck, 'get')
      .mockReturnValue({ payload: { value: mockExemption } })

    getExemptionCacheSpy = jest
      .spyOn(cacheUtils, 'getExemptionCache')
      .mockReturnValue(mockExemption)
  })

  afterAll(async () => {
    await server.stop({ timeout: 0 })
  })

  test('Should throw a 404 if exemption is not found', async () => {
    getExemptionCacheSpy.mockReturnValueOnce({})
    const { statusCode } = await server.inject({
      method: 'GET',
      url: '/exemption/check-your-answers'
    })
    expect(statusCode).toBe(404)
  })

  test('Should throw a 404 if exemption data is not found from server', async () => {
    jest.spyOn(Wreck, 'get').mockReturnValueOnce({ payload: {} })
    const { statusCode } = await server.inject({
      method: 'GET',
      url: '/exemption/check-your-answers'
    })
    expect(statusCode).toBe(404)
  })

  test('Should render a complete check your answers page', async () => {
    const { result, statusCode } = await server.inject({
      method: 'GET',
      url: '/exemption/check-your-answers'
    })
    expect(statusCode).toBe(200)

    const { document } = new JSDOM(result).window
    expect(
      document.querySelector('#check-your-answers-heading').textContent.trim()
    ).toBe('Check your answers before sending your information')

    expect(document.querySelector('.govuk-back-link').textContent.trim()).toBe(
      'Go back to your project'
    )
  })
})
