import { JSDOM } from 'jsdom'
import { getByRole, queryByRole } from '@testing-library/dom'
import { config } from '~/src/config/config.js'
import { marineLicenseRoutes } from '~/src/server/common/constants/routes.js'
import { statusCodes } from '~/src/server/common/constants/status-codes.js'
import { setupTestServer } from '~/tests/integration/shared/test-setup-helpers.js'
import { makeGetRequest } from '~/src/server/test-helpers/server-requests.js'
import { loadPage, submitForm } from '~/tests/integration/shared/app-server.js'
import {
  expectInputError,
  expectInputValue
} from '~/tests/integration/shared/expect-utils.js'

describe('Marine License - Project name', () => {
  const getServer = setupTestServer()

  describe('when marine license is disabled', () => {
    beforeAll(() => {
      config.set('marineLicense.enabled', false)
    })

    test('should render 403 error page when feature is disabled', async () => {
      const { result, statusCode } = await makeGetRequest({
        server: getServer(),
        url: marineLicenseRoutes.MARINE_LICENSE_PROJECT_NAME
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

    test('should render project name page when feature is enabled and no project name set', async () => {
      const document = await loadPage({
        requestUrl: marineLicenseRoutes.MARINE_LICENSE_PROJECT_NAME,
        server: getServer()
      })

      expect(getByRole(document, 'heading', { level: 1 })).toHaveTextContent(
        'Project name'
      )

      getByRole(document, 'button', {
        name: 'Save and continue'
      })

      expectInputValue({
        document,
        inputLabel: 'Project name',
        value: ''
      })

      expect(
        queryByRole(document, 'link', {
          name: 'Back'
        })
      ).not.toBeInTheDocument()

      expect(
        queryByRole(document, 'link', {
          name: 'Cancel'
        })
      ).not.toBeInTheDocument()

      const serviceName = document.querySelector(
        '.govuk-service-navigation__link'
      )

      expect(serviceName).not.toBeInTheDocument()
    })

    test('should show a validation error when submitted without a project name', async () => {
      const submitProjectNameForm = async (formData) => {
        const { document } = await submitForm({
          requestUrl: marineLicenseRoutes.MARINE_LICENSE_PROJECT_NAME,
          server: getServer(),
          formData
        })
        return document
      }

      const document = await submitProjectNameForm({ projectName: '' })
      expectInputError({
        document,
        inputLabel: 'Project name',
        errorMessage: 'Enter the project name'
      })
    })
  })
})
