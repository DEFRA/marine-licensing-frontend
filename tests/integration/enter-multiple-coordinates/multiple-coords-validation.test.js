import { routes } from '~/src/server/common/constants/routes.js'
import {
  expectFieldsetError,
  expectFieldsetInputValue,
  expectNoFieldsetError
} from '~/tests/integration/shared/expect-utils.js'
import { requestBody } from './helpers.js'
import {
  mockExemption,
  setupTestServer
} from '~/tests/integration/shared/test-setup-helpers.js'
import { submitForm } from '~/tests/integration/shared/app-server.js'
import { statusCodes } from '~/src/server/common/constants/status-codes.js'
import {
  exemptionOsgb36Coordinates,
  exemptionWgs84Coordinates
} from '~/tests/integration/enter-multiple-coordinates/fixtures.js'

describe('Multiple co-ordinates - form validation', () => {
  const getServer = setupTestServer()

  const submitCoordinatesForm = async (formData) => {
    const { document } = await submitForm({
      requestUrl: routes.ENTER_MULTIPLE_COORDINATES,
      server: getServer(),
      formData
    })
    return document
  }

  describe('WGS84 co-ordinate system', () => {
    beforeEach(() => mockExemption(exemptionWgs84Coordinates))

    describe('Co-ordinates missing', () => {
      test('all missing', async () => {
        const document = await submitCoordinatesForm(
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
        const document = await submitCoordinatesForm(
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
        const document = await submitCoordinatesForm(
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
      test('latitude has < 6 decimal places', async () => {
        const document = await submitCoordinatesForm(
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

      test('longitude has < 6 decimal places', async () => {
        const document = await submitCoordinatesForm(
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

    it('redirects if all form data is valid', async () => {
      const { response } = await submitForm({
        requestUrl: routes.ENTER_MULTIPLE_COORDINATES,
        server: getServer(),
        formData: requestBody({
          coordinates: [
            ['51.489676', '-0.231530'],
            ['51.495842', '-0.245672'],
            ['51.483219', '-0.228943']
          ],
          system: 'WGS84'
        })
      })
      // page redirected, so no error
      expect(response.statusCode).toBe(statusCodes.redirect)
    })
  })

  describe('OSGB36 co-ordinate system', () => {
    beforeEach(() => mockExemption(exemptionOsgb36Coordinates))

    describe('Co-ordinates missing', () => {
      test('all missing', async () => {
        const document = await submitCoordinatesForm(
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
          errorMessage: 'Enter the eastings of start and end point'
        })
        ;['2', '3'].forEach((pointNumber) => {
          expectFieldsetError({
            document,
            fieldsetLabel: `Point ${pointNumber}`,
            errorMessage: `Enter the eastings of point ${pointNumber}`
          })
          expectFieldsetError({
            document,
            fieldsetLabel: `Point ${pointNumber}`,
            errorMessage: `Enter the northings of point ${pointNumber}`
          })
        })
      })

      test('eastings missing', async () => {
        const document = await submitCoordinatesForm(
          requestBody({
            coordinates: [['', '0.000000']],
            system: 'OSGB36'
          })
        )
        expectFieldsetError({
          document,
          fieldsetLabel: 'Start and end point',
          errorMessage: 'Enter the eastings of start and end point'
        })
        expectNoFieldsetError({
          document,
          fieldsetLabel: 'Start and end point',
          errorMessage: 'Enter the northings of start and end point'
        })
        expectFieldsetInputValue({
          document,
          fieldsetLabel: 'Start and end point',
          inputLabel: 'Northings of start and end point',
          value: '0.000000'
        })
      })

      test('northings missing', async () => {
        const document = await submitCoordinatesForm(
          requestBody({
            coordinates: [['0.000000', '']],
            system: 'OSGB36'
          })
        )
        expectFieldsetError({
          document,
          fieldsetLabel: 'Start and end point',
          errorMessage: 'Enter the northings of start and end point'
        })
        expectNoFieldsetError({
          document,
          fieldsetLabel: 'Start and end point',
          errorMessage: 'Enter the eastings of start and end point'
        })
        expectFieldsetInputValue({
          document,
          fieldsetLabel: 'Start and end point',
          inputLabel: 'Eastings of start and end point',
          value: '0.000000'
        })
      })
    })

    describe('Invalid co-ordinates', () => {
      test('eastings is < 6 digits', async () => {
        const document = await submitCoordinatesForm(
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
          errorMessage: 'Eastings of start and end point must be 6 digits'
        })
        expectNoFieldsetError({
          document,
          fieldsetLabel: 'Start and end point',
          errorMessage: 'Enter the northings of start and end point'
        })
        expectFieldsetInputValue({
          document,
          fieldsetLabel: 'Start and end point',
          inputLabel: 'Northings of start and end point',
          value: '654321'
        })
      })

      test('northings is < 6 digits', async () => {
        const document = await submitCoordinatesForm(
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
          errorMessage: 'Northings of point 3 must be 6 or 7 digits'
        })
        expectNoFieldsetError({
          document,
          fieldsetLabel: 'Point 3',
          errorMessage: 'Enter the eastings of point 3'
        })
        expectFieldsetInputValue({
          document,
          fieldsetLabel: 'Point 3',
          inputLabel: 'Eastings of point 3',
          value: '123458'
        })
      })
    })

    it('redirects if all form data is valid', async () => {
      const { response } = await submitForm({
        requestUrl: routes.ENTER_MULTIPLE_COORDINATES,
        server: getServer(),
        formData: requestBody({
          coordinates: [
            ['123456', '654321'],
            ['123457', '654322'],
            ['123458', '654323']
          ],
          system: 'OSGB36'
        })
      })
      // page redirected, so no error
      expect(response.statusCode).toBe(statusCodes.redirect)
    })
  })
})
