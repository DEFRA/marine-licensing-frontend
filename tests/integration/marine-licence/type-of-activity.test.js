import { getByRole, getByText } from '@testing-library/dom'
import { marineLicenceRoutes } from '~/src/server/common/constants/routes.js'
import {
  mockMarineLicence,
  setupTestServer
} from '~/tests/integration/shared/test-setup-helpers.js'
import { loadPage } from '~/tests/integration/shared/app-server.js'
import { makePostRequest } from '~/src/server/test-helpers/server-requests.js'
import { statusCodes } from '~/src/server/common/constants/status-codes.js'
import { mockMarineLicenceApplication } from '#src/server/test-helpers/mocks/marine-licence-mocks.js'

describe('Type of activity (marine licence)', () => {
  const getServer = setupTestServer()

  test('page elements', async () => {
    mockMarineLicence(mockMarineLicenceApplication)

    const document = await loadPage({
      requestUrl: `${marineLicenceRoutes.MARINE_LICENCE_TYPE_OF_ACTIVITY}?site=1`,
      server: getServer()
    })

    expect(
      getByText(document, mockMarineLicenceApplication.projectName)
    ).toBeInTheDocument()

    expect(getByRole(document, 'link', { name: 'Back' })).toHaveAttribute(
      'href',
      marineLicenceRoutes.MARINE_LICENCE_REVIEW_SITE_DETAILS
    )
    expect(getByRole(document, 'heading', { level: 1 })).toHaveTextContent(
      'Type of activity'
    )

    expect(
      getByRole(document, 'radio', {
        name: 'Construction, alteration or improvement of any works'
      })
    ).toBeInTheDocument()

    expect(
      getByRole(document, 'radio', {
        name: 'Deposit of any substance or object'
      })
    ).toBeInTheDocument()

    expect(
      getByRole(document, 'radio', {
        name: 'Removal of any substance or object'
      })
    ).toBeInTheDocument()

    expect(
      getByRole(document, 'button', { name: 'Continue' })
    ).toBeInTheDocument()

    expect(getByRole(document, 'link', { name: 'Cancel' })).toHaveAttribute(
      'href',
      `${marineLicenceRoutes.MARINE_LICENCE_REVIEW_SITE_DETAILS}`
    )
  })

  test('redirects after valid submission', async () => {
    mockMarineLicence(mockMarineLicenceApplication)

    const response = await makePostRequest({
      url: marineLicenceRoutes.MARINE_LICENCE_TYPE_OF_ACTIVITY,
      server: getServer(),
      formData: {
        activityType: 'deposit',
        activitySubTypeDeposit: 'deposit-type-2'
      }
    })

    expect(response.statusCode).toBe(statusCodes.redirect)
    expect(response.headers.location).toBe(
      marineLicenceRoutes.MARINE_LICENCE_REVIEW_SITE_DETAILS
    )
  })
})
