import { getSiteParam } from './site-number-utils.js'

describe('getSiteParam', () => {
  test('returns empty string when siteNumber is 1', () => {
    expect(getSiteParam(1)).toBe('')
  })

  test('returns site query param when siteNumber is greater than 1', () => {
    expect(getSiteParam(2)).toBe('?site=2')
  })
})
