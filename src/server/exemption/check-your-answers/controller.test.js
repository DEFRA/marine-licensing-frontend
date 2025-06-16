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

    expect(
      document
        .querySelector('#project-details-card .govuk-summary-list__key')
        .textContent.trim()
    ).toBe('Project name')

    expect(
      document
        .querySelector(
          '#project-details-card .govuk-summary-list .govuk-summary-list__value'
        )
        .textContent.trim()
    ).toBe(mockExemption.projectName)

    expect(
      document
        .querySelector(
          '#activity-dates-card .govuk-summary-list .govuk-summary-list__row:first-child .govuk-summary-list__value'
        )
        .textContent.trim()
    ).toBe(mockExemption.activityDates.startDate)

    expect(
      document
        .querySelector(
          '#activity-dates-card .govuk-summary-list .govuk-summary-list__row:last-child .govuk-summary-list__value'
        )
        .textContent.trim()
    ).toBe(mockExemption.activityDates.endDate)

    expect(
      document
        .querySelector(
          '#activity-details-card .govuk-summary-list .govuk-summary-list__row:first-child .govuk-summary-list__value'
        )
        .textContent.trim()
    ).toBe(mockExemption.activityDescription)

    expect(
      document
        .querySelector(
          '#site-details-card .govuk-summary-list .govuk-summary-list__row:first-child .govuk-summary-list__value'
        )
        .textContent.trim()
    ).toBe(mockExemption.siteDetails.coordinatesType)

    expect(
      document
        .querySelector(
          '#site-details-card .govuk-summary-list .govuk-summary-list__row:nth-child(2) .govuk-summary-list__value'
        )
        .textContent.trim()
    ).toBe(mockExemption.siteDetails.coordinatesEntry)

    expect(
      document
        .querySelector(
          '#site-details-card .govuk-summary-list .govuk-summary-list__row:nth-child(3) .govuk-summary-list__value'
        )
        .textContent.trim()
    ).toBe(mockExemption.siteDetails.coordinateSystem)

    expect(
      document
        .querySelector(
          '#site-details-card .govuk-summary-list .govuk-summary-list__row:nth-child(4) .govuk-summary-list__value'
        )
        .textContent.trim()
    ).toBe(
      mockExemption.siteDetails.coordinates.latitude +
        ', ' +
        mockExemption.siteDetails.coordinates.longitude
    )

    expect(
      document
        .querySelector(
          '#site-details-card .govuk-summary-list .govuk-summary-list__row:nth-child(5) .govuk-summary-list__value'
        )
        .textContent.trim()
    ).toBe(mockExemption.siteDetails.circleWidth)

    expect(
      document
        .querySelector(
          '#public-register-card .govuk-summary-list .govuk-summary-list__row:first-child .govuk-summary-list__value'
        )
        .textContent.trim()
        .toUpperCase()
    ).toBe(mockExemption.publicRegister.consent.toUpperCase())
  })
})
