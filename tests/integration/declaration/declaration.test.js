import { vi } from 'vitest'
import { getByRole } from '@testing-library/dom'
import {
  mockMarineLicence,
  setupTestServer
} from '~/tests/integration/shared/test-setup-helpers.js'
import { mockMarineLicenceApplication } from '~/src/server/test-helpers/mocks/marine-licence-mocks.js'
import { loadPage } from '~/tests/integration/shared/app-server.js'
import { makePostRequest } from '~/src/server/test-helpers/server-requests.js'

import * as authUtils from '~/src/server/common/plugins/auth/utils.js'
import * as authRequests from '~/src/server/common/helpers/authenticated-requests.js'
import * as sessionCacheUtils from '~/src/server/common/helpers/session-cache/utils.js'
import {
  routes,
  marineLicenceRoutes
} from '~/src/server/common/constants/routes.js'
import { PROJECT_TYPE } from '~/src/server/common/constants/projects.js'

vi.mock('~/src/server/common/helpers/session-cache/utils.js')

const mockUserSession = {
  displayName: 'Jane Smith',
  email: 'jane.smith@example.com',
  sessionId: 'session-abc'
}

describe('Declaration page', () => {
  const getServer = setupTestServer()

  beforeEach(() => {
    vi.spyOn(authUtils, 'getUserSession').mockResolvedValue(mockUserSession)
  })

  test('render page correctly for marine licence', async () => {
    vi.mocked(sessionCacheUtils.getProjectType).mockReturnValue(
      PROJECT_TYPE.MARINE_LICENCE
    )
    mockMarineLicence({
      ...mockMarineLicenceApplication,
      projectName: 'My ML Project'
    })

    const document = await loadPage({
      requestUrl: routes.DECLARATION,
      server: getServer()
    })

    expect(getByRole(document, 'heading', { level: 1 })).toHaveTextContent(
      'Declaration'
    )

    expect(getByRole(document, 'link', { name: 'Back' })).toHaveAttribute(
      'href',
      marineLicenceRoutes.MARINE_LICENCE_CHECK_YOUR_ANSWERS
    )

    const list = document.querySelector('.govuk-list--bullet')
    expect(list).toBeInTheDocument()

    const items = list.querySelectorAll('li')
    expect(items).toHaveLength(4)
    expect(items[0].textContent).toBe('am authorised to make this agreement')
    expect(items[1].textContent).toBe(
      'to the best of my knowledge, the information provided is correct'
    )
    expect(items[2].textContent).toBe(
      'could be prosecuted if I give information I know, or suspect is false'
    )
    expect(items[3].textContent).toBe(
      'understand I may be sued if I give incorrect information, knowingly or recklessly'
    )
  })

  describe('Submit marine licence', () => {
    const mockApplicationReference = 'ML-REF-INT-001'

    beforeEach(() => {
      vi.mocked(sessionCacheUtils.getProjectType).mockReturnValue(
        PROJECT_TYPE.MARINE_LICENCE
      )
      mockMarineLicence({
        ...mockMarineLicenceApplication,
        projectName: 'My ML Project'
      })
      vi.spyOn(authRequests, 'authenticatedPostRequest').mockResolvedValue({
        payload: {
          message: 'success',
          value: { applicationReference: mockApplicationReference }
        }
      })
    })

    test('submits marine licence and redirects to confirmation page', async () => {
      const { clearMarineLicenceCache } = mockMarineLicence({
        ...mockMarineLicenceApplication,
        projectName: 'My ML Project'
      })

      const { statusCode, headers } = await makePostRequest({
        url: routes.DECLARATION,
        server: getServer()
      })

      expect(statusCode).toBe(302)
      expect(headers.location).toBe(
        `${marineLicenceRoutes.MARINE_LICENCE_CONFIRMATION}?applicationReference=${mockApplicationReference}`
      )
      expect(authRequests.authenticatedPostRequest).toHaveBeenCalledWith(
        expect.any(Object),
        '/marine-licence/submit',
        {
          id: mockMarineLicenceApplication.id,
          userEmail: mockUserSession.email,
          userName: mockUserSession.displayName
        }
      )
      expect(clearMarineLicenceCache).toHaveBeenCalledWith(
        expect.any(Object),
        expect.any(Object)
      )
    })
  })
})
