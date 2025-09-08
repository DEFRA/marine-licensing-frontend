import { validateCoordinates } from '~/src/server/exemption/site-details/enter-multiple-coordinates/validation/validation.js'
import { COORDINATE_SYSTEMS } from '~/src/server/common/constants/exemptions.js'
import wgs84TestCases from './test-cases-wgs84.json'
import osgb36TestCases from './test-cases-osgb36.json'

describe('validateCoordinates', () => {
  describe('WGS84 coordinate system', () => {
    test('valid coordinates', () => {
      const coordinates = [
        { latitude: '55.019889', longitude: '-1.399500' },
        { latitude: '55.019890', longitude: '-1.399501' },
        { latitude: '55.019891', longitude: '-1.399502' }
      ]
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
    it('valid coordinates', () => {
      const coordinates = [
        { eastings: '123456', northings: '654321' },
        { eastings: '234567', northings: '765432' },
        { eastings: '345678', northings: '876543' }
      ]
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
