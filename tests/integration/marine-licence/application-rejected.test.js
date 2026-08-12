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
import { makeGetRequest } from '~/src/server/test-helpers/server-requests.js'

describe('Application rejected', () => {
  const getServer = setupTestServer()
  const marineLicence = mockRejectedMarineLicenceApplication

  test('page elements', async () => {
    mockMarineLicence(mockRejectedMarineLicenceApplication)

    const document = await loadPage({
      requestUrl: `${marineLicenceRoutes.MARINE_LICENCE_APPLICATION_REJECTED}/${marineLicence.id}`,
      server: getServer()
    })

    expect(getByText(document, marineLicence.projectName)).toBeInTheDocument()
    expect(getByRole(document, 'heading', { level: 1 })).toHaveTextContent(
      'We are unable to progress your application'
    )
    expect(
      getByText(document, (content) =>
        content.includes(
          `We have reviewed your application (${marineLicence.applicationReference}) and we are unable to progress it as submitted.`
        )
      )
    ).toBeInTheDocument()
    expect(
      getByRole(document, 'heading', {
        level: 2,
        name: 'Why we are unable to progress your application'
      })
    ).toBeInTheDocument()
    expect(getByText(document, 'Site location')).toBeInTheDocument()
    expect(getByText(document, 'Water Framework Directive')).toBeInTheDocument()
    expect(
      getByText(document, marineLicence.rejectedInformation)
    ).toBeInTheDocument()
    expect(
      getByRole(document, 'heading', {
        level: 2,
        name: 'Charges for reviewing your application'
      })
    ).toBeInTheDocument()
    expect(
      getByRole(document, 'heading', {
        level: 2,
        name: 'What you can do'
      })
    ).toBeInTheDocument()
    expect(
      getByText(document, 'you will get a new fee estimate')
    ).toBeInTheDocument()
    expect(
      getByText(
        document,
        'your new application will have a new reference number'
      )
    ).toBeInTheDocument()
    expect(
      getByRole(document, 'button', { name: 'Apply again' })
    ).toHaveAttribute(
      'href',
      `${marineLicenceRoutes.MARINE_LICENCE_UPDATE_AND_RESUBMIT}/${marineLicence.id}`
    )

    expect(
      getByRole(document, 'link', {
        name: 'View your original application'
      })
    ).toHaveAttribute(
      'href',
      `${marineLicenceRoutes.MARINE_LICENCE_VIEW_DETAILS}/${marineLicence.id}`
    )
  })

  test('should redirect if marine licence is not rejected', async () => {
    mockMarineLicence(mockSubmittedMarineLicenceApplication)

    const response = await makeGetRequest({
      url: `${marineLicenceRoutes.MARINE_LICENCE_APPLICATION_REJECTED}/${marineLicence.id}`,
      server: getServer()
    })

    expect(response.statusCode).toBe(statusCodes.redirect)
    expect(response.headers.location).toBe(routes.DASHBOARD)
  })

  test('should return bad request for an invalid marine licence id', async () => {
    const response = await makeGetRequest({
      url: `${marineLicenceRoutes.MARINE_LICENCE_APPLICATION_REJECTED}/not-a-valid-id`,
      server: getServer()
    })

    expect(response.statusCode).toBe(statusCodes.badRequest)
  })
})
