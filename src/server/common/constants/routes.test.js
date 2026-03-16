import { isEntraIdRoute } from '#src/server/common/constants/routes.js'

describe('isEntraIdRoute', () => {
  test('should return false for null', () => {
    expect(isEntraIdRoute(null)).toBe(false)
  })

  test('should return false for undefined', () => {
    expect(isEntraIdRoute(undefined)).toBe(false)
  })

  test('should return false for empty string', () => {
    expect(isEntraIdRoute('')).toBe(false)
  })

  test('should return true for exact match on /view-details', () => {
    expect(isEntraIdRoute('/view-details')).toBe(true)
  })

  test('should return true for route starting with /view-details', () => {
    expect(isEntraIdRoute('/view-details/abc123')).toBe(true)
  })

  test('should return true for exact match on /admin/exemptions', () => {
    expect(isEntraIdRoute('/admin/exemptions')).toBe(true)
  })

  test('should return true for route starting with /admin/exemptions', () => {
    expect(isEntraIdRoute('/admin/exemptions/some-id')).toBe(true)
  })

  test('should return false for non-entra route', () => {
    expect(isEntraIdRoute('/exemption/task-list')).toBe(false)
  })
})
