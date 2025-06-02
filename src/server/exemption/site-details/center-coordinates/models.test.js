import {
  wgs64ValidationSchema,
  osgb36ValidationSchema
} from '~/src/server/exemption/site-details/center-coordinates/models.js'
import { mockExemption } from '~/src/server/test-helpers/mocks.js'
import { COORDINATE_SYSTEMS } from '~/src/server/common/constants/exemptions.js'

const mockCoordinates = {
  [COORDINATE_SYSTEMS.WGS84]: {
    latitude: mockExemption.siteDetails.coordinates.latitude,
    longitude: mockExemption.siteDetails.coordinates.longitude
  },
  [COORDINATE_SYSTEMS.OSGB36]: { eastings: 425053, northings: 564180 }
}

describe('#centerCoordinate models', () => {
  beforeEach(() => {
    jest.resetAllMocks()
  })

  describe('#wgs64ValidationSchema model', () => {
    test('Should correctly validate on valid data', () => {
      const request = {
        latitude: mockExemption.siteDetails.coordinates.latitude,
        longitude: mockExemption.siteDetails.coordinates.longitude
      }

      const result = wgs64ValidationSchema.validate(request)

      expect(result.error).toBeUndefined()
    })

    test('Should correctly validate on empty data', () => {
      const request = {}

      const result = wgs64ValidationSchema.validate(request)

      expect(result.error.message).toBe('LATITUDE_REQUIRED')
    })

    test('Should correctly validate on empty latitude data', () => {
      const request = {
        longitude: mockExemption.siteDetails.coordinates.longitude
      }

      const result = wgs64ValidationSchema.validate(request)

      expect(result.error.message).toBe('LATITUDE_REQUIRED')
    })

    test('Should correctly validate on empty longitude data', () => {
      const request = {
        latitude: mockExemption.siteDetails.coordinates.latitude
      }

      const result = wgs64ValidationSchema.validate(request)

      expect(result.error.message).toBe('LONGITUDE_REQUIRED')
    })

    test('Should correctly validate when latitude and longitude is below minimum allowed value', () => {
      const request = {
        latitude: -91,
        longitude: -91
      }

      const result = wgs64ValidationSchema.validate(request, {
        abortEarly: false
      })

      expect(result.error.message).toContain('LATITUDE_LENGTH')
      expect(result.error.message).toContain('LONGITUDE_LENGTH')
    })

    test('Should correctly validate when latitude and longitude is above maximum allowed value', () => {
      const request = {
        latitude: 91,
        longitude: 91
      }

      const result = wgs64ValidationSchema.validate(request, {
        abortEarly: false
      })

      expect(result.error.message).toContain('LATITUDE_LENGTH')
      expect(result.error.message).toContain('LONGITUDE_LENGTH')
    })
  })

  describe('#osgb36ValidationSchema model', () => {
    test('Should correctly validate on valid data', () => {
      const request = mockCoordinates[COORDINATE_SYSTEMS.OSGB36]

      const result = osgb36ValidationSchema.validate(request)

      expect(result.error).toBeUndefined()
    })

    test('Should correctly validate on empty data', () => {
      const request = {}

      const result = osgb36ValidationSchema.validate(request)

      expect(result.error.message).toBe('EASTINGS_REQUIRED')
    })

    test('Should correctly validate on empty northings data', () => {
      const request = {
        eastings: mockCoordinates[COORDINATE_SYSTEMS.OSGB36].eastings
      }

      const result = osgb36ValidationSchema.validate(request)

      expect(result.error.message).toBe('NORTHINGS_REQUIRED')
    })

    test('Should correctly validate on empty eastings data', () => {
      const request = {
        northings: mockCoordinates[COORDINATE_SYSTEMS.OSGB36].northings
      }

      const result = osgb36ValidationSchema.validate(request)

      expect(result.error.message).toBe('EASTINGS_REQUIRED')
    })

    test('Should correctly validate when northings and eastings is below minimum allowed value', () => {
      const request = {
        eastings: 10000,
        northings: 10000
      }

      const result = osgb36ValidationSchema.validate(request, {
        abortEarly: false
      })

      expect(result.error.message).toContain('EASTINGS_LENGTH')
      expect(result.error.message).toContain('NORTHINGS_LENGTH')
    })

    test('Should correctly validate when northings and eastings is above maximum allowed value', () => {
      const request = {
        eastings: 9999999,
        northings: 99999999
      }

      const result = osgb36ValidationSchema.validate(request, {
        abortEarly: false
      })

      expect(result.error.message).toContain('EASTINGS_LENGTH')
      expect(result.error.message).toContain('NORTHINGS_LENGTH')
    })

    test('Should correctly validate when eastings is a negative number', () => {
      const request = {
        eastings: -425053,
        northings: 564180
      }

      const result = osgb36ValidationSchema.validate(request, {
        abortEarly: false
      })

      expect(result.error.message).toContain('EASTINGS_POSITIVE_NUMBER')
    })

    test('Should correctly validate when northings is a negative number', () => {
      const request = {
        eastings: 425053,
        northings: -564180
      }

      const result = osgb36ValidationSchema.validate(request, {
        abortEarly: false
      })

      expect(result.error.message).toContain('NORTHINGS_POSITIVE_NUMBER')
    })

    test('Should correctly validate when both eastings and northings are negative numbers', () => {
      const request = {
        eastings: -425053,
        northings: -564180
      }

      const result = osgb36ValidationSchema.validate(request, {
        abortEarly: false
      })

      expect(result.error.message).toContain('EASTINGS_POSITIVE_NUMBER')
      expect(result.error.message).toContain('NORTHINGS_POSITIVE_NUMBER')
    })
  })
})
