import { getSiteNumber } from './site-number.js'

describe('#getSiteNumber', () => {
  test('should return 1 for current single object implementation', () => {
    const mockExemption = {
      id: 'test-exemption-123',
      projectName: 'Test Project',
      siteDetails: {
        siteName: 'Test Site'
      }
    }

    expect(getSiteNumber(mockExemption, {})).toBe(1)
  })

  test('should return 1 when siteDetails is undefined', () => {
    const mockExemption = {
      id: 'test-exemption-123',
      projectName: 'Test Project'
    }

    expect(getSiteNumber(mockExemption, {})).toBe(1)
  })

  test('should return 1 when siteDetails is null', () => {
    const mockExemption = {
      id: 'test-exemption-123',
      projectName: 'Test Project',
      siteDetails: null
    }

    expect(getSiteNumber(mockExemption, {})).toBe(1)
  })

  test('should return 1 when siteDetails is an array with no URL parameter', () => {
    const mockExemption = {
      id: 'test-exemption-123',
      projectName: 'Test Project',
      siteDetails: [
        { siteName: 'Site 1' },
        { siteName: 'Site 2' },
        { siteName: 'Site 3' }
      ]
    }

    expect(getSiteNumber(mockExemption, {})).toBe(1)
  })

  test('should return site index from URL parameter when valid', () => {
    const mockExemption = {
      id: 'test-exemption-123',
      projectName: 'Test Project',
      siteDetails: [
        { siteName: 'Site 1' },
        { siteName: 'Site 2' },
        { siteName: 'Site 3' }
      ]
    }

    const mockRequest = {
      params: { siteIndex: '2' }
    }

    expect(getSiteNumber(mockExemption, mockRequest)).toBe(2)
  })

  test('should default to 1 when URL parameter is invalid', () => {
    const mockExemption = {
      id: 'test-exemption-123',
      projectName: 'Test Project',
      siteDetails: [{ siteName: 'Site 1' }, { siteName: 'Site 2' }]
    }

    const mockRequest = {
      params: { siteIndex: '5' }
    }

    expect(getSiteNumber(mockExemption, mockRequest)).toBe(1)
  })

  test('should default to 1 when URL parameter is not a number', () => {
    const mockExemption = {
      id: 'test-exemption-123',
      projectName: 'Test Project',
      siteDetails: [{ siteName: 'Site 1' }, { siteName: 'Site 2' }]
    }

    const mockRequest = {
      params: { siteIndex: 'invalid' }
    }

    expect(getSiteNumber(mockExemption, mockRequest)).toBe(1)
  })

  test('should handle null exemption gracefully', () => {
    expect(getSiteNumber(null, {})).toBe(1)
  })

  test('should handle undefined exemption gracefully', () => {
    expect(getSiteNumber(undefined, {})).toBe(1)
  })
})
