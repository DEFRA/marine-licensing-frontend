import { vi } from 'vitest'
import { buildNavigation } from '#src/config/nunjucks/context/build-navigation.js'
import { getAuthProvider } from '#src/server/common/helpers/authenticated-requests.js'
import { AUTH_STRATEGIES } from '#src/server/common/constants/auth.js'
import { USER_ROLE_TYPES } from '#src/server/common/constants/user-types.js'

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
            text: 'Submissions',
            href: '/submissions'
          }
        ])
      )
    })

    test('Should provide expected highlighted navigation details', () => {
      expect(buildNavigation({ path: '/' })).toEqual(
        expect.arrayContaining([
          {
            active: false,
            text: 'Submissions',
            href: '/submissions'
          }
        ])
      )
    })

    test('Should show Home', () => {
      expect(buildNavigation({ path: '/home' })[0]).toEqual({
        text: 'Home',
        href: '/home',
        active: true
      })
    })

    test('Should include a Sign out nav link', () => {
      expect(buildNavigation({ path: '/submissions' })).toEqual(
        expect.arrayContaining([
          {
            href: '/sign-out',
            text: 'Sign out'
          }
        ])
      )
    })

    test('should add a Defra account nav item', () => {
      expect(buildNavigation({ path: '/submissions' })).toEqual(
        expect.arrayContaining([
          {
            text: 'Defra account',
            href: '#'
          }
        ])
      )
    })
  })

  describe('defra ID consultee', () => {
    const consulteeRequest = (path) => ({
      path,
      auth: { credentials: { userRoleType: USER_ROLE_TYPES.CONSULTEE } }
    })

    beforeEach(() =>
      vi.mocked(getAuthProvider).mockReturnValue(AUTH_STRATEGIES.DEFRA_ID)
    )

    test('Should show Consultations instead of Home and Submissions', () => {
      const navigation = buildNavigation(consulteeRequest('/submissions'))

      expect(navigation[0]).toEqual({
        text: 'Consultations',
        href: '/consultations',
        active: false
      })
      expect(navigation.map(({ text }) => text)).toEqual([
        'Consultations',
        'Defra account',
        'Sign out'
      ])
    })

    test('Should highlight Consultations on the consultations page', () => {
      expect(buildNavigation(consulteeRequest('/consultations'))[0]).toEqual({
        text: 'Consultations',
        href: '/consultations',
        active: true
      })
    })
  })

  describe('entra ID user', () => {
    test('should return no nav items', () => {
      vi.mocked(getAuthProvider).mockReturnValue(AUTH_STRATEGIES.ENTRA_ID)
      expect(buildNavigation({ path: '/submissions' })).toEqual([])
    })
  })
})
