import { vi } from 'vitest'
import { getByRole, getByText } from '@testing-library/dom'
import {
  marineLicenceRoutes,
  routes
} from '~/src/server/common/constants/routes.js'
import {
  mockMarineLicence,
  setupTestServer
} from '~/tests/integration/shared/test-setup-helpers.js'
import { loadPage, submitForm } from '~/tests/integration/shared/app-server.js'
import { makeGetRequest } from '~/src/server/test-helpers/server-requests.js'
import {
  mockMarineLicenceWithApplicationTask,
  mockApplicationTaskContactId
} from '~/src/server/test-helpers/mocks/marine-licence-mocks.js'
import { statusCodes } from '~/src/server/common/constants/status-codes.js'
import { getUserSession } from '~/src/server/common/plugins/auth/utils.js'
import { authenticatedPostRequest } from '~/src/server/common/helpers/authenticated-requests.js'

vi.mock('~/src/server/common/plugins/auth/utils.js')

const licence = mockMarineLicenceWithApplicationTask
const [task] = licence.applicationTasks
const pageUrl = `${marineLicenceRoutes.MARINE_LICENCE_WITHHOLDING_NOTIFICATION}/${licence.id}`
const viewDetailsUrl = `${marineLicenceRoutes.MARINE_LICENCE_VIEW_DETAILS}/${licence.id}`

describe('Withholding notification', () => {
  const getServer = setupTestServer()

  beforeEach(() => {
    vi.mocked(getUserSession).mockResolvedValue({
      contactId: mockApplicationTaskContactId
    })
    vi.mocked(authenticatedPostRequest).mockResolvedValue({})
    mockMarineLicence(licence)
  })

  const loadNotification = () =>
    loadPage({ requestUrl: pageUrl, server: getServer() })

  describe('GET', () => {
    test('renders a section per basis with its decision and comments', async () => {
      const document = await loadNotification()

      expect(getByRole(document, 'heading', { level: 1 })).toHaveTextContent(
        'Update on the information you asked us to withhold'
      )

      expect(
        getByRole(document, 'heading', { name: 'National security' })
      ).toBeInTheDocument()
      expect(
        getByText(
          document,
          "We've decided not to withhold the information you asked us to."
        )
      ).toBeInTheDocument()
      expect(
        getByText(document, task.data.nationalSecurity.comments)
      ).toBeInTheDocument()

      expect(
        getByRole(document, 'heading', {
          name: 'Commercial or industrial confidentiality'
        })
      ).toBeInTheDocument()
      expect(
        getByText(
          document,
          "We've agreed to withhold some of the information you asked us to."
        )
      ).toBeInTheDocument()
      expect(
        getByText(document, task.data.commercialConfidentiality.comments)
      ).toBeInTheDocument()
    })

    test('points the withdrawal wording at the submissions page', async () => {
      const document = await loadNotification()

      expect(
        getByRole(document, 'link', {
          name: 'withdraw your application from your Submissions page'
        })
      ).toHaveAttribute('href', routes.DASHBOARD)
    })

    test('the back link returns to view details without resolving the task', async () => {
      const document = await loadNotification()

      expect(getByRole(document, 'link', { name: 'Back' })).toHaveAttribute(
        'href',
        viewDetailsUrl
      )
      expect(authenticatedPostRequest).not.toHaveBeenCalled()
    })

    test('forbids anyone who did not submit the application', async () => {
      vi.mocked(getUserSession).mockResolvedValue({ contactId: 'someone-else' })

      const { statusCode } = await makeGetRequest({
        url: pageUrl,
        server: getServer()
      })

      expect(statusCode).toBe(statusCodes.forbidden)
    })

    test('forbids a request with no signed-in user', async () => {
      vi.mocked(getUserSession).mockResolvedValue(null)

      const { statusCode } = await makeGetRequest({
        url: pageUrl,
        server: getServer()
      })

      expect(statusCode).toBe(statusCodes.forbidden)
    })

    test('redirects to view details when the application has no such task', async () => {
      mockMarineLicence({ ...licence, applicationTasks: [] })

      const { statusCode, headers } = await makeGetRequest({
        url: pageUrl,
        server: getServer()
      })

      expect(statusCode).toBe(statusCodes.redirect)
      expect(headers.location).toBe(viewDetailsUrl)
    })
  })

  describe('POST', () => {
    const notificationForm = (document) =>
      document.querySelector(
        `form[action="${marineLicenceRoutes.MARINE_LICENCE_WITHHOLDING_NOTIFICATION}"]`
      )

    const hiddenInputs = (form) =>
      Object.fromEntries(
        [...form.querySelectorAll('input[type="hidden"]')].map((input) => [
          input.name,
          input.value
        ])
      )

    test('the rendered form marks the task as read and returns to view details', async () => {
      const document = await loadNotification()
      const form = notificationForm(document)

      expect(
        getByRole(document, 'button', { name: 'Mark as read and continue' })
      ).toBeInTheDocument()

      const { response } = await submitForm({
        requestUrl: form.getAttribute('action'),
        server: getServer(),
        formData: hiddenInputs(form)
      })

      expect(authenticatedPostRequest).toHaveBeenCalledWith(
        expect.anything(),
        `/marine-licence/${licence.id}/application-tasks/${task.taskId}/resolve`,
        {}
      )
      expect(response.statusCode).toBe(statusCodes.redirect)
      expect(response.headers.location).toBe(viewDetailsUrl)
    })

    test('returns to view details even when the API call fails', async () => {
      vi.mocked(authenticatedPostRequest).mockRejectedValue(new Error('boom'))

      const { response } = await submitForm({
        requestUrl: marineLicenceRoutes.MARINE_LICENCE_WITHHOLDING_NOTIFICATION,
        server: getServer(),
        formData: { marineLicenceId: licence.id, taskId: task.taskId }
      })

      expect(response.statusCode).toBe(statusCodes.redirect)
      expect(response.headers.location).toBe(viewDetailsUrl)
    })

    test('redirects to the dashboard when the payload is invalid', async () => {
      const { response } = await submitForm({
        requestUrl: marineLicenceRoutes.MARINE_LICENCE_WITHHOLDING_NOTIFICATION,
        server: getServer(),
        formData: { marineLicenceId: licence.id, taskId: 'not-an-id' }
      })

      expect(authenticatedPostRequest).not.toHaveBeenCalled()
      expect(response.statusCode).toBe(statusCodes.redirect)
      expect(response.headers.location).toBe(routes.DASHBOARD)
    })
  })
})
