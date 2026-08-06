import { getByRole, getByText } from '@testing-library/dom'
import {
  marineLicenceRoutes,
  routes
} from '~/src/server/common/constants/routes.js'
import {
  mockMarineLicence,
  setupTestServer
} from '~/tests/integration/shared/test-setup-helpers.js'
import { loadPage } from '~/tests/integration/shared/app-server.js'
import {
  mockRejectedMarineLicenceApplication,
  mockSubmittedMarineLicenceApplication
} from '#src/server/test-helpers/mocks/marine-licence-mocks.js'
import { statusCodes } from '~/src/server/common/constants/status-codes.js'
import {
  makeGetRequest,
  makePostRequest
} from '~/src/server/test-helpers/server-requests.js'

describe('Update and resubmit', () => {
  const getServer = setupTestServer()
  const marineLicence = mockRejectedMarineLicenceApplication

  test('page elements', async () => {
    mockMarineLicence(mockRejectedMarineLicenceApplication)

    const document = await loadPage({
      requestUrl: `${marineLicenceRoutes.MARINE_LICENCE_UPDATE_AND_RESUBMIT}/${marineLicence.id}`,
      server: getServer()
    })

    expect(getByText(document, marineLicence.projectName)).toBeInTheDocument()
    expect(getByRole(document, 'link', { name: 'Back' })).toHaveAttribute(
      'href',
      `${marineLicenceRoutes.MARINE_LICENCE_APPLICATION_REJECTED}/${marineLicence.id}`
    )
    expect(getByRole(document, 'heading', { level: 1 })).toHaveTextContent(
      'Apply again for this project'
    )
    expect(
      document.body.textContent.includes(
        `To support you with this, we will copy all of the information from your original application (${marineLicence.applicationReference}) into a new draft application.`
      )
    ).toBe(true)
    expect(
      getByText(
        document,
        "Fix the issues we've identified before you submit. You can also change anything else."
      )
    ).toBeInTheDocument()
    expect(
      getByText(
        document,
        "Your original application will stay 'Unable to progress'. You can still view it in your projects."
      )
    ).toBeInTheDocument()
    expect(
      getByRole(document, 'button', {
        name: 'Create new draft and fix issues'
      })
    ).toBeInTheDocument()
    expect(getByRole(document, 'link', { name: 'Cancel' })).toHaveAttribute(
      'href',
      `${marineLicenceRoutes.MARINE_LICENCE_APPLICATION_REJECTED}/${marineLicence.id}`
    )
  })

  test('should redirect if marine licence is not rejected', async () => {
    mockMarineLicence(mockSubmittedMarineLicenceApplication)

    const response = await makeGetRequest({
      url: `${marineLicenceRoutes.MARINE_LICENCE_UPDATE_AND_RESUBMIT}/${marineLicence.id}`,
      server: getServer()
    })

    expect(response.statusCode).toBe(statusCodes.redirect)
    expect(response.headers.location).toBe(routes.DASHBOARD)
  })

  test('should submit without error', async () => {
    const response = await makePostRequest({
      url: `${marineLicenceRoutes.MARINE_LICENCE_UPDATE_AND_RESUBMIT}/${marineLicence.id}`,
      server: getServer()
    })

    expect(response.statusCode).toBe(statusCodes.noContent)
  })

  test('should return bad request for an invalid marine licence id', async () => {
    const response = await makeGetRequest({
      url: `${marineLicenceRoutes.MARINE_LICENCE_UPDATE_AND_RESUBMIT}/not-a-valid-id`,
      server: getServer()
    })

    expect(response.statusCode).toBe(statusCodes.badRequest)
  })
})
