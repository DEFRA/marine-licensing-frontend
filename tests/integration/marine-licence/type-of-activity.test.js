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
      requestUrl: `${marineLicenceRoutes.MARINE_LICENCE_TYPE_OF_ACTIVITY}?site=1&activity=1`,
      server: getServer()
    })

    expect(
      getByText(document, mockMarineLicenceApplication.projectName)
    ).toBeInTheDocument()

    expect(getByText(document, 'Site 1 - Activity 1')).toBeInTheDocument()

    expect(getByRole(document, 'link', { name: 'Back' })).toHaveAttribute(
      'href',
      `${marineLicenceRoutes.MARINE_LICENCE_REVIEW_SITE_DETAILS}#activity-details-site-1-activity-1`
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
  })

  test('pre-selects construction activity type and sub-type', async () => {
    mockMarineLicence({
      ...mockMarineLicenceApplication,
      siteDetails: [
        {
          ...mockMarineLicenceApplication.siteDetails[0],
          activityDetails: [
            {
              ...mockMarineLicenceApplication.siteDetails[0].activityDetails[0],
              activityType: 'construction',
              activitySubType: 'construction-type-2'
            }
          ]
        }
      ]
    })

    const document = await loadPage({
      requestUrl: `${marineLicenceRoutes.MARINE_LICENCE_TYPE_OF_ACTIVITY}?site=1&activity=1`,
      server: getServer()
    })

    expect(
      getByRole(document, 'radio', {
        name: 'Construction, alteration or improvement of any works'
      })
    ).toBeChecked()

    expect(
      getByRole(document, 'radio', {
        name: 'Maintenance of existing works'
      })
    ).toBeChecked()
  })

  test('pre-selects deposit activity type and sub-type', async () => {
    mockMarineLicence({
      ...mockMarineLicenceApplication,
      siteDetails: [
        {
          ...mockMarineLicenceApplication.siteDetails[0],
          activityDetails: [
            {
              ...mockMarineLicenceApplication.siteDetails[0].activityDetails[0],
              activityType: 'deposit',
              activitySubType: 'deposit-type-1'
            }
          ]
        }
      ]
    })

    const document = await loadPage({
      requestUrl: `${marineLicenceRoutes.MARINE_LICENCE_TYPE_OF_ACTIVITY}?site=1&activity=1`,
      server: getServer()
    })

    expect(
      getByRole(document, 'radio', {
        name: 'Deposit of any substance or object'
      })
    ).toBeChecked()

    expect(
      getByRole(document, 'radio', {
        name: 'Continuation of existing deposit activity'
      })
    ).toBeChecked()
  })

  test('pre-selects removal activity type and sub-type', async () => {
    mockMarineLicence({
      ...mockMarineLicenceApplication,
      siteDetails: [
        {
          ...mockMarineLicenceApplication.siteDetails[0],
          activityDetails: [
            {
              ...mockMarineLicenceApplication.siteDetails[0].activityDetails[0],
              activityType: 'removal',
              activitySubType: 'removal-type-3'
            }
          ]
        }
      ]
    })

    const document = await loadPage({
      requestUrl: `${marineLicenceRoutes.MARINE_LICENCE_TYPE_OF_ACTIVITY}?site=1&activity=1`,
      server: getServer()
    })

    expect(
      getByRole(document, 'radio', {
        name: 'Removal of any substance or object'
      })
    ).toBeChecked()

    expect(
      getByRole(document, 'radio', {
        name: 'Removal for replacement'
      })
    ).toBeChecked()
  })

  test('redirects after valid submission', async () => {
    mockMarineLicence(mockMarineLicenceApplication)

    const response = await makePostRequest({
      url: `${marineLicenceRoutes.MARINE_LICENCE_TYPE_OF_ACTIVITY}?site=1&activity=1`,
      server: getServer(),
      formData: {
        activityType: 'deposit',
        activitySubTypeDeposit: 'deposit-type-2'
      }
    })

    expect(response.statusCode).toBe(statusCodes.redirect)
    expect(response.headers.location).toBe(
      '/marine-licence/activity-details/what-new-deposit-activity-are-you-doing?site=1&activity=1'
    )
  })
})
