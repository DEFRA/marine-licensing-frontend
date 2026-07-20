import { vi } from 'vitest'
import { JSDOM } from 'jsdom'
import { toHaveNoViolations } from 'vitest-axe/matchers'
import { runAxeChecks } from '~/.vite/axe-helper.js'
import { statusCodes } from '~/src/server/common/constants/status-codes.js'
import * as cdpUploadService from '~/src/services/cdp-upload-service/index.js'
import { makeGetRequest } from '~/src/server/test-helpers/server-requests.js'
import { config } from '~/src/config/config.js'
import { getUserSession } from '~/src/server/common/plugins/auth/utils.js'
import { postloginUserSession } from '~/src/server/common/helpers/defraid-login/session-cache.js'

/**
 * @param {object} options
 * @param {() => import('@hapi/hapi').Server} options.getServer
 * @param {Array<object>} options.pages
 * @param {(page: object) => void} options.setupMocks
 */
export function runPageAccessibilityTests({ getServer, pages, setupMocks }) {
  beforeAll(() => {
    config.set('marineLicence.enabled', true)
    expect.extend(toHaveNoViolations)
  })

  beforeEach(() => {
    vi.mocked(getUserSession).mockReset()
    vi.mocked(postloginUserSession.get).mockReset()

    vi.spyOn(cdpUploadService, 'getCdpUploadService').mockReturnValue({
      getStatus: vi.fn().mockResolvedValue({
        status: 'pending'
      }),
      initiate: vi.fn().mockResolvedValue({
        uploadId: 'test-upload-id',
        statusUrl: 'test-status-url',
        fileType: 'kml'
      })
    })
  })

  test.each(pages)(
    '"$title" page',
    async ({ title, url, session, auth, ...pageOptions }) => {
      if (session) {
        vi.mocked(postloginUserSession.get).mockResolvedValue('organisation')
        vi.mocked(getUserSession).mockResolvedValue(session)
      }

      setupMocks({ ...pageOptions, session })

      const response = await makeGetRequest({
        url,
        server: getServer(),
        auth
      })

      expect(response.statusCode).toBe(statusCodes.ok)
      const { document } = new JSDOM(response.result).window
      expect(document.querySelector('title')).toHaveTextContent(
        `${title} - Get permission for marine work`
      )
      await runAxeChecks(document.documentElement)
    },
    10000
  )
}
