import { JSDOM } from 'jsdom'
import { getByRole } from '@testing-library/dom'
import { config } from '~/src/config/config.js'
import { marineLicenseRoutes } from '~/src/server/common/constants/routes.js'
import { statusCodes } from '~/src/server/common/constants/status-codes.js'
import { setupTestServer } from '~/tests/integration/shared/test-setup-helpers.js'
import { makeGetRequest } from '~/src/server/test-helpers/server-requests.js'

describe('Marine License - Project name', () => {
  const getServer = setupTestServer()

  describe('when marine license is disabled', () => {
    beforeAll(() => {
      config.set('marineLicense.enabled', false)
    })

    test('should render 403 error page when feature is disabled', async () => {
      const { result, statusCode } = await makeGetRequest({
        server: getServer(),
        url: marineLicenseRoutes.PROJECT_NAME
      })

      expect(statusCode).toBe(statusCodes.forbidden)

      const document = new JSDOM(result).window.document

      const heading = getByRole(document, 'heading', {
        name: 'You do not have permission to view this page',
        level: 1
      })
      expect(heading).toBeInTheDocument()
    })
  })

  describe('when marine license is enabled', () => {
    beforeAll(() => {
      config.set('marineLicense.enabled', true)
    })

    afterAll(() => {
      config.set('marineLicense.enabled', false)
    })

    test('should render project name page when feature is enabled', async () => {
      const { result, statusCode } = await makeGetRequest({
        server: getServer(),
        url: marineLicenseRoutes.PROJECT_NAME
      })

      expect(statusCode).toBe(statusCodes.ok)

      const document = new JSDOM(result).window.document

      const heading = getByRole(document, 'heading', {
        name: 'Project Name',
        level: 1
      })
      expect(heading).toBeInTheDocument()
    })
  })
})
