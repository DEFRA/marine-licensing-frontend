import { validateCoordinates } from '#src/server/common/validation/multiple-coordinates/validate.js'
import { COORDINATE_SYSTEMS } from '#src/server/common/constants/coordinate-systems.js'
import wgs84ErrorCases from './validation-error-cases-wgs84.json'
import osgb36ErrorCases from './validation-error-cases-osgb36.json'
import wgs84SuccessCases from './validation-success-cases-wgs84.json'
import osgb36SuccessCases from './validation-success-cases-osgb36.json'

describe('Validate multiple coordinates', () => {
  describe('WGS84 coordinate system', () => {
    test.each(wgs84SuccessCases)('$description', ({ coordinates }) => {
      const result = validateCoordinates(
        coordinates,
        'test-id',
        COORDINATE_SYSTEMS.WGS84
      )
      expect(result.error).toBeUndefined()
    })

    describe('error cases', () => {
      test.each(wgs84ErrorCases)(
        '$expectedError',
        ({ coordinates, expectedError }) => {
          const result = validateCoordinates(
            coordinates,
            'test-id',
            COORDINATE_SYSTEMS.WGS84
          )
          expect(result.error).toBeDefined()
          expect(result.error.message).toContain(expectedError)
        }
      )
    })
  })

  describe('OSGB36 coordinate system', () => {
    test.each(osgb36SuccessCases)('$description', ({ coordinates }) => {
      const result = validateCoordinates(
        coordinates,
        'test-id',
        COORDINATE_SYSTEMS.OSGB36
      )
      expect(result.error).toBeUndefined()
    })

    describe('error cases', () => {
      test.each(osgb36ErrorCases)(
        '$expectedError',
        ({ coordinates, expectedError }) => {
          const result = validateCoordinates(
            coordinates,
            'test-id',
            COORDINATE_SYSTEMS.OSGB36
          )
          expect(result.error).toBeDefined()
          expect(result.error.message).toContain(expectedError)
        }
      )
    })
  })
})
