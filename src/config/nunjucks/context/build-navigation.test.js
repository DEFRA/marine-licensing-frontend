import { vi } from 'vitest'
import { buildNavigation } from '#src/config/nunjucks/context/build-navigation.js'
import { getAuthProvider } from '#src/server/common/helpers/authenticated-requests.js'
import { AUTH_STRATEGIES } from '#src/server/common/constants/auth.js'

vi.mock('~/src/server/common/helpers/authenticated-requests.js')

describe('#buildNavigation', () => {
  describe('defra ID user', () => {
    beforeEach(() =>
      vi.mocked(getAuthProvider).mockReturnValue(AUTH_STRATEGIES.DEFRA_ID)
    )

    test('Should provide expected navigation details', () => {
      expect(buildNavigation({ path: '/non-existent-path' })).toEqual(
        expect.arrayContaining([
          {
            active: false,
            text: 'Projects',
            href: '/projects'
          }
        ])
      )
    })

    test('Should provide expected highlighted navigation details', () => {
      expect(buildNavigation({ path: '/' })).toEqual(
        expect.arrayContaining([
          {
            active: false,
            text: 'Projects',
            href: '/projects'
          }
        ])
      )
    })

    test('Should include a Sign out nav link', () => {
      expect(buildNavigation({ path: '/projects' })).toEqual(
        expect.arrayContaining([
          {
            href: '/sign-out',
            text: 'Sign out'
          }
        ])
      )
    })

    test('should add a Defra account nav item', () => {
      expect(buildNavigation({ path: '/projects' })).toEqual(
        expect.arrayContaining([
          {
            text: 'Defra account',
            href: '#'
          }
        ])
      )
    })
  })

  describe('entra ID user', () => {
    test('should return no nav items', () => {
      vi.mocked(getAuthProvider).mockReturnValue(AUTH_STRATEGIES.ENTRA_ID)
      expect(buildNavigation({ path: '/projects' })).toEqual([])
    })
  })
})
