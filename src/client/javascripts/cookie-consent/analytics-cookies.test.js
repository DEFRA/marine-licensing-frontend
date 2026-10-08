// @vitest-environment jsdom
// @vitest-environment-options { "url": "https://service.example.com/some/page" }
import {
  buildDeletableDomains,
  deleteAnalyticsCookies
} from './analytics-cookies.js'

const EXPIRED = 'expires=Thu, 01 Jan 1970 00:00:00 GMT'

const clearAllCookies = () => {
  for (const cookie of document.cookie.split(';')) {
    const name = cookie.split('=')[0].trim()
    if (name) {
      document.cookie = `${name}=;${EXPIRED};path=/`
      document.cookie = `${name}=;${EXPIRED};path=/;domain=.example.com`
    }
  }
}

describe('buildDeletableDomains', () => {
  test('lists the host, the dotted host and every parent domain', () => {
    expect(buildDeletableDomains('service.example.gov.uk')).toEqual([
      'service.example.gov.uk',
      '.service.example.gov.uk',
      '.example.gov.uk',
      '.gov.uk'
    ])
  })

  test('handles a bare two-label host', () => {
    expect(buildDeletableDomains('example.com')).toEqual([
      'example.com',
      '.example.com'
    ])
  })
})

describe('deleteAnalyticsCookies', () => {
  beforeEach(() => {
    clearAllCookies()
    document.cookie = 'cookies_preferences_set=true; path=/'
  })

  test('removes host cookies with Google Analytics prefixes and leaves other cookies', () => {
    document.cookie = '_ga=GA1.1.111; path=/'
    document.cookie = '_ga_ABC123=GS1.1.222; path=/'
    document.cookie = '_gid=GA1.1.333; path=/'
    document.cookie = '_gat_UA-1=1; path=/'
    document.cookie = '_dc_gtm_UA-1=1; path=/'

    const removed = deleteAnalyticsCookies()

    expect(removed.sort()).toEqual(
      ['_dc_gtm_UA-1', '_ga', '_ga_ABC123', '_gat_UA-1', '_gid'].sort()
    )
    expect(document.cookie).toBe('cookies_preferences_set=true')
  })

  test('removes a Google Analytics cookie set on a parent domain', () => {
    document.cookie = '_ga=GA1.1.444; path=/; domain=.example.com'
    expect(document.cookie).toContain('_ga=GA1.1.444')

    deleteAnalyticsCookies()

    expect(document.cookie).not.toContain('_ga=')
  })

  test('removes host Microsoft Clarity cookies', () => {
    document.cookie = '_clck=1e3cbzq^2^g9y^1^2466; path=/'
    document.cookie = '_clsk=abc123^1^1^0^z.clarity.ms/collect; path=/'

    const removed = deleteAnalyticsCookies()

    expect(removed.sort()).toEqual(['_clck', '_clsk'])
    expect(document.cookie).toBe('cookies_preferences_set=true')
  })

  test('removes a Microsoft Clarity cookie set on a parent domain', () => {
    document.cookie = '_clck=1e3cbzq^2^g9y^1^2466; path=/; domain=.example.com'
    expect(document.cookie).toContain('_clck=')

    deleteAnalyticsCookies()

    expect(document.cookie).not.toContain('_clck=')
  })

  test('leaves cookies that only share a prefix with a Microsoft Clarity cookie', () => {
    document.cookie = '_clckother=1; path=/'

    expect(deleteAnalyticsCookies()).toEqual([])
    expect(document.cookie).toContain('_clckother=1')
  })

  test('returns an empty list when there are no analytics cookies', () => {
    expect(deleteAnalyticsCookies()).toEqual([])
    expect(document.cookie).toBe('cookies_preferences_set=true')
  })
})
