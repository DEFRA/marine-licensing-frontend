import { JSDOM } from 'jsdom'
import * as cacheUtils from '~/src/server/common/helpers/session-cache/utils.js'
import { createServer } from '~/src/server/index.js'
import { mockExemption } from '~/src/server/test-helpers/mocks.js'
import * as authRequests from '~/src/server/common/helpers/authenticated-requests.js'

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
      .spyOn(authRequests, 'authenticatedGetRequest')
      .mockResolvedValue({ payload: { value: mockExemption } })

    getExemptionCacheSpy = jest
      .spyOn(cacheUtils, 'getExemptionCache')
      .mockReturnValue(mockExemption)
  })

  afterAll(async () => {
    await server.stop({ timeout: 0 })
  })

  describe('POST /exemption/check-your-answers', () => {
    beforeEach(() => {
      jest.spyOn(authRequests, 'authenticatedPostRequest').mockResolvedValue({
        payload: {
          message: 'success',
          value: {
            applicationReference: 'APP-123456',
            submittedAt: '2025-01-01T10:00:00.000Z'
          }
        }
      })
    })

    test('Should submit exemption and redirect to confirmation page', async () => {
      const { statusCode, headers } = await server.inject({
        method: 'POST',
        url: '/exemption/check-your-answers'
      })

      expect(statusCode).toBe(302)
      expect(headers.location).toBe(
        '/exemption/confirmation?applicationReference=APP-123456'
      )
      expect(authRequests.authenticatedPostRequest).toHaveBeenCalledWith(
        expect.any(Object),
        '/exemption/submit',
        { id: mockExemption.id }
      )
    })

    test('Should throw a 404 if exemption is not found', async () => {
      getExemptionCacheSpy.mockReturnValueOnce({})
      const { statusCode } = await server.inject({
        method: 'POST',
        url: '/exemption/check-your-answers'
      })
      expect(statusCode).toBe(404)
    })

    test('Should handle API errors gracefully', async () => {
      jest
        .spyOn(authRequests, 'authenticatedPostRequest')
        .mockRejectedValue(new Error('API Error'))

      const { statusCode } = await server.inject({
        method: 'POST',
        url: '/exemption/check-your-answers'
      })

      expect(statusCode).toBe(400)
    })

    test('Should handle unexpected API response format', async () => {
      jest.spyOn(authRequests, 'authenticatedPostRequest').mockResolvedValue({
        payload: { message: 'error', error: 'Something went wrong' }
      })

      const { statusCode } = await server.inject({
        method: 'POST',
        url: '/exemption/check-your-answers'
      })

      expect(statusCode).toBe(400)
    })
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
    jest
      .spyOn(authRequests, 'authenticatedGetRequest')
      .mockResolvedValueOnce({ payload: {} })
    const { statusCode } = await server.inject({
      method: 'GET',
      url: '/exemption/check-your-answers'
    })
    expect(statusCode).toBe(404)
  })

  test('Should throw a 404 if exemption data has no taskList', async () => {
    jest.spyOn(authRequests, 'authenticatedGetRequest').mockResolvedValueOnce({
      payload: {
        value: {
          id: 'test-id'
          // Missing taskList property
        }
      }
    })
    const { statusCode } = await server.inject({
      method: 'GET',
      url: '/exemption/check-your-answers'
    })
    expect(statusCode).toBe(404)
  })

  test('Should throw a 404 if exemption data value is null', async () => {
    jest.spyOn(authRequests, 'authenticatedGetRequest').mockResolvedValueOnce({
      payload: {
        value: null
      }
    })
    const { statusCode } = await server.inject({
      method: 'GET',
      url: '/exemption/check-your-answers'
    })
    expect(statusCode).toBe(404)
  })

  test('Should render page when exemption has no siteDetails', async () => {
    const exemptionWithoutSiteDetails = {
      ...mockExemption,
      siteDetails: null
    }

    getExemptionCacheSpy.mockReturnValueOnce(exemptionWithoutSiteDetails)

    const { statusCode } = await server.inject({
      method: 'GET',
      url: '/exemption/check-your-answers'
    })
    expect(statusCode).toBe(200)
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
    ).toBe('01/01/2025')

    expect(
      document
        .querySelector(
          '#activity-dates-card .govuk-summary-list .govuk-summary-list__row:last-child .govuk-summary-list__value'
        )
        .textContent.trim()
    ).toBe('01/01/2025')

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
    ).toBe(
      'Manually enter one set of coordinates and a width to create a circular site'
    )

    expect(
      document
        .querySelector(
          '#site-details-card .govuk-summary-list .govuk-summary-list__row:nth-child(2) .govuk-summary-list__value'
        )
        .textContent.trim()
        .replace(/\s+/g, ' ')
    ).toBe('WGS84 (World Geodetic System 1984) Latitude and longitude')

    expect(
      document
        .querySelector(
          '#site-details-card .govuk-summary-list .govuk-summary-list__row:nth-child(3) .govuk-summary-list__value'
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
          '#site-details-card .govuk-summary-list .govuk-summary-list__row:nth-child(4) .govuk-summary-list__value'
        )
        .textContent.trim()
    ).toBe(mockExemption.siteDetails.circleWidth + ' metres')

    expect(
      document
        .querySelector(
          '#public-register-card .govuk-summary-list .govuk-summary-list__row:first-child .govuk-summary-list__value'
        )
        .textContent.trim()
        .toUpperCase()
    ).toBe(mockExemption.publicRegister.consent.toUpperCase())

    // Verify the form is present and configured correctly
    const form = document.querySelector('form')
    expect(form).toBeTruthy()
    expect(form.getAttribute('method')).toBe('post')

    // Verify the submit button is inside the form
    const submitButton = document.querySelector('#confirm-and-send')
    expect(submitButton).toBeTruthy()
    expect(form.contains(submitButton)).toBe(true)
  })

  test('Should display WGS84 coordinates correctly', async () => {
    const wgs84Exemption = {
      ...mockExemption,
      siteDetails: {
        ...mockExemption.siteDetails,
        coordinateSystem: 'wgs84',
        coordinates: {
          latitude: '55.019889',
          longitude: '-1.399500'
        }
      }
    }

    getExemptionCacheSpy.mockReturnValueOnce(wgs84Exemption)

    const { result, statusCode } = await server.inject({
      method: 'GET',
      url: '/exemption/check-your-answers'
    })
    expect(statusCode).toBe(200)

    const { document } = new JSDOM(result).window
    expect(
      document
        .querySelector(
          '#site-details-card .govuk-summary-list .govuk-summary-list__row:nth-child(3) .govuk-summary-list__value'
        )
        .textContent.trim()
    ).toBe('55.019889, -1.399500')
  })

  test('Should display OSGB36 coordinates correctly', async () => {
    const osgb36Exemption = {
      ...mockExemption,
      siteDetails: {
        ...mockExemption.siteDetails,
        coordinateSystem: 'osgb36',
        coordinates: {
          eastings: '425053',
          northings: '564180'
        }
      }
    }

    getExemptionCacheSpy.mockReturnValueOnce(osgb36Exemption)

    const { result, statusCode } = await server.inject({
      method: 'GET',
      url: '/exemption/check-your-answers'
    })
    expect(statusCode).toBe(200)

    const { document } = new JSDOM(result).window
    expect(
      document
        .querySelector(
          '#site-details-card .govuk-summary-list .govuk-summary-list__row:nth-child(2) .govuk-summary-list__value'
        )
        .textContent.trim()
        .replace(/\s+/g, ' ')
    ).toBe('OSGB36 (National Grid) Eastings and Northings')

    expect(
      document
        .querySelector(
          '#site-details-card .govuk-summary-list .govuk-summary-list__row:nth-child(3) .govuk-summary-list__value'
        )
        .textContent.trim()
    ).toBe('425053, 564180')
  })
})
