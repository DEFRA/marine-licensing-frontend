import { vi } from 'vitest'
import { isProjectViewable, isInternalUserView } from './utils.js'
import { PROJECT_STATUS } from '#src/server/common/constants/projects.js'
import { EXEMPTIONS_KEY } from '#src/server/common/constants/exemptions.js'
import { AUTH_STRATEGIES } from '#src/server/common/constants/auth.js'
import {
  routes,
  marineLicenceRoutes
} from '#src/server/common/constants/routes.js'
import { getAuthProvider } from '#src/server/common/helpers/authenticated-requests.js'

vi.mock('#src/server/common/helpers/authenticated-requests.js')

describe('isProjectViewable', () => {
  describe('Allows project to be viewed', () => {
    test.each([
      ['Submitted', PROJECT_STATUS.SUBMITTED],
      ['Active', PROJECT_STATUS.ACTIVE],
      ['Withdrawn', PROJECT_STATUS.WITHDRAWN]
    ])(
      'when status is %s and applicationReference is present',
      (_label, status) => {
        expect(
          isProjectViewable({ status, applicationReference: 'REF/2024/001' })
        ).toBe(true)
      }
    )
  })

  describe('Does not allow project to be viewed', () => {
    test('when status is Draft', () => {
      expect(
        isProjectViewable({
          status: PROJECT_STATUS.DRAFT,
          applicationReference: 'REF/2024/001'
        })
      ).toBe(false)
    })

    test.each([
      ['null', null],
      ['undefined', undefined],
      ['empty string', '']
    ])('when applicationReference is %s', (_label, applicationReference) => {
      expect(
        isProjectViewable({
          status: PROJECT_STATUS.SUBMITTED,
          applicationReference
        })
      ).toBe(false)
    })

    test('when status is Draft and applicationReference is missing', () => {
      expect(
        isProjectViewable({
          status: PROJECT_STATUS.DRAFT,
          applicationReference: null
        })
      ).toBe(false)
    })
  })
})

describe('isInternalUserView', () => {
  const makeRequest = (path) => ({ path })

  beforeEach(() => {
    getAuthProvider.mockReset()
  })

  describe('user is an Internal User', () => {
    test('exemption route and auth provider is ENTRA_ID', () => {
      getAuthProvider.mockReturnValue(AUTH_STRATEGIES.ENTRA_ID)
      const request = makeRequest(`${routes.VIEW_DETAILS_INTERNAL_USER}/123`)
      expect(isInternalUserView(request, EXEMPTIONS_KEY)).toBe(true)
    })

    test('marine licence route and auth provider is ENTRA_ID', () => {
      getAuthProvider.mockReturnValue(AUTH_STRATEGIES.ENTRA_ID)
      const request = makeRequest(
        `${marineLicenceRoutes.MARINE_LICENCE_VIEW_DETAILS_INTERNAL_USER}/456`
      )
      expect(isInternalUserView(request, 'MARINE_LICENCE')).toBe(true)
    })
  })

  describe('user is not an Internal User', () => {
    test('auth provider is not ENTRA_ID', () => {
      getAuthProvider.mockReturnValue('defra-id')
      const request = makeRequest(`${routes.VIEW_DETAILS_INTERNAL_USER}/123`)
      expect(isInternalUserView(request, EXEMPTIONS_KEY)).toBe(false)
    })

    test('path does not match exemption internal user route', () => {
      getAuthProvider.mockReturnValue(AUTH_STRATEGIES.ENTRA_ID)
      const request = makeRequest('/some-other-path/123')
      expect(isInternalUserView(request, EXEMPTIONS_KEY)).toBe(false)
    })
  })
})
