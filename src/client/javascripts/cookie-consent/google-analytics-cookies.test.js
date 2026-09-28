// @vitest-environment jsdom
// @vitest-environment-options { "url": "https://service.example.com/some/page" }
import {
  buildDeletableDomains,
  deleteGoogleAnalyticsCookies
} from './google-analytics-cookies.js'

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

describe('deleteGoogleAnalyticsCookies', () => {
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

    const removed = deleteGoogleAnalyticsCookies()

    expect(removed.sort()).toEqual(
      ['_dc_gtm_UA-1', '_ga', '_ga_ABC123', '_gat_UA-1', '_gid'].sort()
    )
    expect(document.cookie).toBe('cookies_preferences_set=true')
  })

  test('removes a Google Analytics cookie set on a parent domain', () => {
    document.cookie = '_ga=GA1.1.444; path=/; domain=.example.com'
    expect(document.cookie).toContain('_ga=GA1.1.444')

    deleteGoogleAnalyticsCookies()

    expect(document.cookie).not.toContain('_ga=')
  })

  test('returns an empty list when there are no Google Analytics cookies', () => {
    expect(deleteGoogleAnalyticsCookies()).toEqual([])
    expect(document.cookie).toBe('cookies_preferences_set=true')
  })
})
