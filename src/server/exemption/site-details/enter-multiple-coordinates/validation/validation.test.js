import { validateCoordinates } from '#src/server/exemption/site-details/enter-multiple-coordinates/validation/validation.js'
import { COORDINATE_SYSTEMS } from '#src/server/common/constants/exemptions.js'
import wgs84TestCases from './validation-error-cases-wgs84.json'
import osgb36TestCases from './validation-error-cases-osgb36.json'
import successTestCases from './validation-success-cases-wgs84.json'
import osgb36SuccessTestCases from './validation-success-cases-osgb36.json'

describe('Validate multiple coordinates', () => {
  describe('WGS84 coordinate system', () => {
    test.each(successTestCases)('$description', ({ coordinates }) => {
      const exemptionId = 'test-id'

      const result = validateCoordinates(
        coordinates,
        exemptionId,
        COORDINATE_SYSTEMS.WGS84
      )
      expect(result.error).toBeUndefined()
    })

    describe('error cases', () => {
      test.each(wgs84TestCases)(
        '$expectedError',
        ({ coordinates, expectedError }) => {
          const exemptionId = 'test-id'

          const result = validateCoordinates(
            coordinates,
            exemptionId,
            COORDINATE_SYSTEMS.WGS84
          )

          expect(result.error).toBeDefined()
          expect(result.error.message).toContain(expectedError)
        }
      )
    })
  })

  describe('OSGB36 coordinate system', () => {
    test.each(osgb36SuccessTestCases)('$description', ({ coordinates }) => {
      const exemptionId = 'test-id'

      const result = validateCoordinates(
        coordinates,
        exemptionId,
        COORDINATE_SYSTEMS.OSGB36
      )
      expect(result.error).toBeUndefined()
    })

    describe('error cases', () => {
      test.each(osgb36TestCases)(
        '$expectedError',
        ({ coordinates, expectedError }) => {
          const exemptionId = 'test-id'

          const result = validateCoordinates(
            coordinates,
            exemptionId,
            COORDINATE_SYSTEMS.OSGB36
          )

          expect(result.error).toBeDefined()
          expect(result.error.message).toContain(expectedError)
        }
      )
    })
  })
})
