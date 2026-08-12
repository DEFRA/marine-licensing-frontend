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
  CONTACT_EMAIL,
  CONTACT_PHONE
} from '~/src/server/marine-licence/application-transferred/controller.js'
import { MCMS_LOGIN_URL } from '~/src/server/common/constants/mcms.js'
import {
  mockSubmittedMarineLicenceApplication,
  mockTransferredMarineLicenceApplication
} from '#src/server/test-helpers/mocks/marine-licence-mocks.js'
import { statusCodes } from '~/src/server/common/constants/status-codes.js'
import { makeGetRequest } from '~/src/server/test-helpers/server-requests.js'

describe('Application transferred', () => {
  const getServer = setupTestServer()
  const marineLicence = mockTransferredMarineLicenceApplication

  test('page elements', async () => {
    mockMarineLicence(mockTransferredMarineLicenceApplication)

    const document = await loadPage({
      requestUrl: `${marineLicenceRoutes.MARINE_LICENCE_APPLICATION_TRANSFERRED}/${marineLicence.id}`,
      server: getServer()
    })

    expect(getByText(document, marineLicence.projectName)).toBeInTheDocument()
    expect(getByRole(document, 'link', { name: 'Back' })).toHaveAttribute(
      'href',
      routes.DASHBOARD
    )
    expect(getByRole(document, 'heading', { level: 1 })).toHaveTextContent(
      'Your application has been transferred'
    )
    expect(
      getByText(document, (content) =>
        content.includes(
          `Your application (${marineLicence.applicationReference}) has been transferred from Get permission for marine work to our Marine Case Management System (MCMS).`
        )
      )
    ).toBeInTheDocument()
    expect(
      getByRole(document, 'heading', {
        level: 2,
        name: 'What happens next'
      })
    ).toBeInTheDocument()
    expect(
      getByRole(document, 'link', {
        name: 'track the progress of your application'
      })
    ).toHaveAttribute('href', MCMS_LOGIN_URL)
    expect(
      getByRole(document, 'link', { name: CONTACT_EMAIL })
    ).toHaveAttribute('href', `mailto:${CONTACT_EMAIL}`)
    expect(getByText(document, `Phone: ${CONTACT_PHONE}`)).toBeInTheDocument()
    expect(
      getByRole(document, 'link', {
        name: 'View your submitted application in this service'
      })
    ).toHaveAttribute(
      'href',
      `${marineLicenceRoutes.MARINE_LICENCE_VIEW_DETAILS}/${marineLicence.id}`
    )
  })

  test('should if marine licence is not transferred', async () => {
    mockMarineLicence(mockSubmittedMarineLicenceApplication)

    const response = await makeGetRequest({
      url: `${marineLicenceRoutes.MARINE_LICENCE_APPLICATION_TRANSFERRED}/${marineLicence.id}`,
      server: getServer()
    })

    expect(response.statusCode).toBe(statusCodes.redirect)
    expect(response.headers.location).toBe(routes.DASHBOARD)
  })

  test('should return bad request for an invalid marine licence id', async () => {
    const response = await makeGetRequest({
      url: `${marineLicenceRoutes.MARINE_LICENCE_APPLICATION_TRANSFERRED}/not-a-valid-id`,
      server: getServer()
    })

    expect(response.statusCode).toBe(statusCodes.badRequest)
  })
})
