import { JSDOM } from 'jsdom'
import { getByRole } from '@testing-library/dom'
import { statusCodes } from '~/src/server/common/constants/status-codes.js'
import {
  expectFieldsetError,
  expectFieldsetInputValue,
  expectNoFieldsetError
} from '~/tests/integration/shared/expect-utils.js'
import { requestBody } from './helpers.js'

export function sharedEnterMultipleCoordinatesTests({
  getRequest,
  postRequest,
  projectName,
  backHref,
  cancelHref,
  wgs84FirstCoord,
  osgb36FirstCoord,
  setupWgs84,
  setupOsgb36,
  setupEmptyWgs84,
  redirectHref
}) {
  const parseDocument = async (formData) => {
    const response = await postRequest(formData)
    return new JSDOM(response.result).window.document
  }

  describe('WGS84 co-ordinate system', () => {
    beforeEach(() => setupWgs84())

    test('should render page correctly with pre-populated WGS84 coordinates', async () => {
      const { result, statusCode } = await getRequest()

      expect(statusCode).toBe(statusCodes.ok)

      const { document } = new JSDOM(result).window

      expect(
        getByRole(document, 'heading', {
          name: /Enter multiple sets of coordinates to mark the boundary of the site/
        })
      ).toBeInTheDocument()

      expect(
        document.querySelector('.govuk-caption-l').textContent.trim()
      ).toBe(projectName)

      expect(getByRole(document, 'link', { name: 'Back' })).toHaveAttribute(
        'href',
        backHref
      )

      expect(getByRole(document, 'link', { name: 'Cancel' })).toHaveAttribute(
        'href',
        cancelHref
      )

      expect(
        document.querySelector('[name="coordinates[0][latitude]"]').value
      ).toBe(wgs84FirstCoord.latitude)
      expect(
        document.querySelector('[name="coordinates[0][longitude]"]').value
      ).toBe(wgs84FirstCoord.longitude)
    })

    test('should render page with empty inputs when cache has no coordinates', async () => {
      setupEmptyWgs84()
      const { result, statusCode } = await getRequest()

      expect(statusCode).toBe(statusCodes.ok)

      const { document } = new JSDOM(result).window
      expect(
        document.querySelector('[name="coordinates[0][latitude]"]').value
      ).toBe('')
    })

    describe('Co-ordinates missing', () => {
      test('all missing', async () => {
        const document = await parseDocument(
          requestBody({
            coordinates: [
              ['', ''],
              ['', ''],
              ['', '']
            ],
            system: 'WGS84'
          })
        )
        expectFieldsetError({
          document,
          fieldsetLabel: 'Start and end point',
          errorMessage: 'Enter the latitude of start and end point'
        })
        ;['2', '3'].forEach((pointNumber) => {
          expectFieldsetError({
            document,
            fieldsetLabel: `Point ${pointNumber}`,
            errorMessage: `Enter the latitude of point ${pointNumber}`
          })
          expectFieldsetError({
            document,
            fieldsetLabel: `Point ${pointNumber}`,
            errorMessage: `Enter the longitude of point ${pointNumber}`
          })
        })
      })

      test('latitude missing', async () => {
        const document = await parseDocument(
          requestBody({
            coordinates: [['', '0.000000']],
            system: 'WGS84'
          })
        )
        expectFieldsetError({
          document,
          fieldsetLabel: 'Start and end point',
          errorMessage: 'Enter the latitude of start and end point'
        })
        expectNoFieldsetError({
          document,
          fieldsetLabel: 'Start and end point',
          errorMessage: 'Enter the longitude of start and end point'
        })
        expectFieldsetInputValue({
          document,
          fieldsetLabel: 'Start and end point',
          inputLabel: 'Longitude of start and end point',
          value: '0.000000'
        })
      })

      test('longitude missing', async () => {
        const document = await parseDocument(
          requestBody({
            coordinates: [['0.000000', '']],
            system: 'WGS84'
          })
        )
        expectFieldsetError({
          document,
          fieldsetLabel: 'Start and end point',
          errorMessage: 'Enter the longitude of start and end point'
        })
        expectNoFieldsetError({
          document,
          fieldsetLabel: 'Start and end point',
          errorMessage: 'Enter the latitude of start and end point'
        })
        expectFieldsetInputValue({
          document,
          fieldsetLabel: 'Start and end point',
          inputLabel: 'Latitude of start and end point',
          value: '0.000000'
        })
      })
    })

    describe('Invalid co-ordinates', () => {
      test('latitude has fewer than 6 decimal places', async () => {
        const document = await parseDocument(
          requestBody({
            coordinates: [
              ['51', '-0.231530'],
              ['51.495842', '-0.245672'],
              ['51.483219', '-0.228943']
            ],
            system: 'WGS84'
          })
        )
        expectFieldsetError({
          document,
          fieldsetLabel: 'Start and end point',
          errorMessage:
            'Latitude of start and end point must include 6 decimal places, like 55.019889'
        })
        expectNoFieldsetError({
          document,
          fieldsetLabel: 'Start and end point',
          errorMessage: 'Enter the longitude of start and end point'
        })
        expectFieldsetInputValue({
          document,
          fieldsetLabel: 'Start and end point',
          inputLabel: 'Longitude of start and end point',
          value: '-0.231530'
        })
      })

      test('longitude has fewer than 6 decimal places', async () => {
        const document = await parseDocument(
          requestBody({
            coordinates: [
              ['51.495842', '-0.245672'],
              ['51.489676', '0'],
              ['51.483219', '-0.228943']
            ],
            system: 'WGS84'
          })
        )
        expectFieldsetError({
          document,
          fieldsetLabel: 'Point 2',
          errorMessage:
            'Longitude of point 2 must include 6 decimal places, like -1.399500'
        })
        expectNoFieldsetError({
          document,
          fieldsetLabel: 'Point 2',
          errorMessage: 'Enter the latitude of point 2'
        })
        expectFieldsetInputValue({
          document,
          fieldsetLabel: 'Point 2',
          inputLabel: 'Latitude of point 2',
          value: '51.489676'
        })
      })
    })

    test('should redirect on valid WGS84 submission', async () => {
      const response = await postRequest(
        requestBody({
          coordinates: [
            ['51.489676', '-0.231530'],
            ['51.495842', '-0.245672'],
            ['51.483219', '-0.228943']
          ],
          system: 'WGS84'
        })
      )
      expect(response.statusCode).toBe(statusCodes.redirect)
      expect(response.headers.location).toBe(redirectHref)
    })

    test('should re-render with an added point when add button is submitted', async () => {
      const response = await postRequest({
        ...requestBody({
          coordinates: [
            ['51.489676', '-0.231530'],
            ['51.495842', '-0.245672'],
            ['51.483219', '-0.228943']
          ],
          system: 'WGS84'
        }),
        add: 'add'
      })

      expect(response.statusCode).toBe(statusCodes.ok)

      const { document } = new JSDOM(response.result).window
      expect(
        document.querySelector('[name="coordinates[3][latitude]"]')
      ).toBeTruthy()
    })

    test('should render validation error when fewer than 3 coordinate points provided', async () => {
      const response = await postRequest(
        requestBody({
          coordinates: [['51.507400', '-0.127800']],
          system: 'WGS84'
        })
      )

      expect(response.statusCode).toBe(statusCodes.ok)

      const { document } = new JSDOM(response.result).window
      expect(document.querySelector('.govuk-error-summary')).toBeTruthy()
      expect(document.body.textContent).toContain(
        'You must provide at least 3 coordinate points'
      )
    })
  })

  describe('OSGB36 co-ordinate system', () => {
    beforeEach(() => setupOsgb36())

    test('should render OSGB36 page with pre-populated coordinates', async () => {
      const { result, statusCode } = await getRequest()

      expect(statusCode).toBe(statusCodes.ok)

      const { document } = new JSDOM(result).window
      expect(
        document.querySelector('[name="coordinates[0][easting]"]').value
      ).toBe(osgb36FirstCoord.easting)
      expect(
        document.querySelector('[name="coordinates[0][northing]"]').value
      ).toBe(osgb36FirstCoord.northing)
    })

    describe('Co-ordinates missing', () => {
      test('all missing', async () => {
        const document = await parseDocument(
          requestBody({
            coordinates: [
              ['', ''],
              ['', ''],
              ['', '']
            ],
            system: 'OSGB36'
          })
        )
        expectFieldsetError({
          document,
          fieldsetLabel: 'Start and end point',
          errorMessage: 'Enter the easting of start and end point'
        })
        ;['2', '3'].forEach((pointNumber) => {
          expectFieldsetError({
            document,
            fieldsetLabel: `Point ${pointNumber}`,
            errorMessage: `Enter the easting of point ${pointNumber}`
          })
          expectFieldsetError({
            document,
            fieldsetLabel: `Point ${pointNumber}`,
            errorMessage: `Enter the northing of point ${pointNumber}`
          })
        })
      })

      test('easting missing', async () => {
        const document = await parseDocument(
          requestBody({
            coordinates: [['', '654321']],
            system: 'OSGB36'
          })
        )
        expectFieldsetError({
          document,
          fieldsetLabel: 'Start and end point',
          errorMessage: 'Enter the easting of start and end point'
        })
        expectNoFieldsetError({
          document,
          fieldsetLabel: 'Start and end point',
          errorMessage: 'Enter the northing of start and end point'
        })
        expectFieldsetInputValue({
          document,
          fieldsetLabel: 'Start and end point',
          inputLabel: 'Northing of start and end point',
          value: '654321'
        })
      })

      test('northing missing', async () => {
        const document = await parseDocument(
          requestBody({
            coordinates: [['123456', '']],
            system: 'OSGB36'
          })
        )
        expectFieldsetError({
          document,
          fieldsetLabel: 'Start and end point',
          errorMessage: 'Enter the northing of start and end point'
        })
        expectNoFieldsetError({
          document,
          fieldsetLabel: 'Start and end point',
          errorMessage: 'Enter the easting of start and end point'
        })
        expectFieldsetInputValue({
          document,
          fieldsetLabel: 'Start and end point',
          inputLabel: 'Easting of start and end point',
          value: '123456'
        })
      })
    })

    describe('Invalid co-ordinates', () => {
      test('easting has fewer than 6 digits', async () => {
        const document = await parseDocument(
          requestBody({
            coordinates: [
              ['12345', '654321'],
              ['123457', '654322'],
              ['123458', '654323']
            ],
            system: 'OSGB36'
          })
        )
        expectFieldsetError({
          document,
          fieldsetLabel: 'Start and end point',
          errorMessage: 'Easting of start and end point must be 6 digits'
        })
        expectNoFieldsetError({
          document,
          fieldsetLabel: 'Start and end point',
          errorMessage: 'Enter the northing of start and end point'
        })
        expectFieldsetInputValue({
          document,
          fieldsetLabel: 'Start and end point',
          inputLabel: 'Northing of start and end point',
          value: '654321'
        })
      })

      test('northing has fewer than 6 digits', async () => {
        const document = await parseDocument(
          requestBody({
            coordinates: [
              ['123456', '654321'],
              ['123457', '654322'],
              ['123458', '654']
            ],
            system: 'OSGB36'
          })
        )
        expectFieldsetError({
          document,
          fieldsetLabel: 'Point 3',
          errorMessage: 'Northing of point 3 must be 6 or 7 digits'
        })
        expectNoFieldsetError({
          document,
          fieldsetLabel: 'Point 3',
          errorMessage: 'Enter the easting of point 3'
        })
        expectFieldsetInputValue({
          document,
          fieldsetLabel: 'Point 3',
          inputLabel: 'Easting of point 3',
          value: '123458'
        })
      })
    })

    test('should redirect on valid OSGB36 submission', async () => {
      const response = await postRequest(
        requestBody({
          coordinates: [
            ['123456', '654321'],
            ['123457', '654322'],
            ['123458', '654323']
          ],
          system: 'OSGB36'
        })
      )
      expect(response.statusCode).toBe(statusCodes.redirect)
      expect(response.headers.location).toBe(redirectHref)
    })
  })
}
