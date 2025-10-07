import { validateCentreCoordinates } from './validate.js'
import { COORDINATE_SYSTEMS } from '#src/server/common/constants/exemptions.js'
import wgs84SuccessTestCases from './validation-success-cases-wgs84.json'
import osgb36SuccessTestCases from './validation-success-cases-osgb36.json'
import wgs84ErrorTestCases from './validation-error-cases-wgs84.json'
import osgb36ErrorTestCases from './validation-error-cases-osgb36.json'

describe('Validate centre coordinates', () => {
  describe('WGS84 coordinate system', () => {
    test.each(wgs84SuccessTestCases)('$description', ({ payload }) => {
      const result = validateCentreCoordinates(
        payload,
        COORDINATE_SYSTEMS.WGS84
      )
      expect(result.error).toBeUndefined()
    })

    describe('error cases', () => {
      test.each(wgs84ErrorTestCases)(
        '$expectedError',
        ({ payload, expectedError }) => {
          const result = validateCentreCoordinates(
            payload,
            COORDINATE_SYSTEMS.WGS84
          )
          expect(result.error).toBeDefined()
          expect(result.error.message).toContain(expectedError)
        }
      )
    })
  })

  describe('OSGB36 coordinate system', () => {
    test.each(osgb36SuccessTestCases)('$description', ({ payload }) => {
      const result = validateCentreCoordinates(
        payload,
        COORDINATE_SYSTEMS.OSGB36
      )
      expect(result.error).toBeUndefined()
    })

    describe('error cases', () => {
      test.each(osgb36ErrorTestCases)(
        '$expectedError',
        ({ payload, expectedError }) => {
          const result = validateCentreCoordinates(
            payload,
            COORDINATE_SYSTEMS.OSGB36
          )
          expect(result.error).toBeDefined()
          expect(result.error.message).toContain(expectedError)
        }
      )
    })
  })
})
