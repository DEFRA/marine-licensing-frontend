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

describe('Duration (marine licence)', () => {
  const getServer = setupTestServer()

  test('page elements', async () => {
    mockMarineLicence(mockMarineLicenceApplication)

    const document = await loadPage({
      requestUrl: `${marineLicenceRoutes.MARINE_LICENCE_DURATION}?site=1&activity=1`,
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
      'What is the maximum duration of the activity?'
    )

    expect(
      getByText(
        document,
        'Enter 0 in any box that does not apply. For example, 2 years 0 months, or 0 years 6 months'
      )
    ).toBeInTheDocument()

    expect(
      getByRole(document, 'textbox', { name: 'Years' })
    ).toBeInTheDocument()
    expect(
      getByRole(document, 'textbox', { name: 'Months' })
    ).toBeInTheDocument()

    expect(
      getByRole(document, 'button', { name: 'Save and continue' })
    ).toBeInTheDocument()
  })

  test('pre-populates values from session', async () => {
    mockMarineLicence({
      ...mockMarineLicenceApplication,
      siteDetails: [
        {
          ...mockMarineLicenceApplication.siteDetails[0],
          activityDetails: [
            {
              ...mockMarineLicenceApplication.siteDetails[0].activityDetails[0],
              activityDuration: { years: 2, months: 6 }
            }
          ]
        }
      ]
    })

    const document = await loadPage({
      requestUrl: `${marineLicenceRoutes.MARINE_LICENCE_DURATION}?site=1&activity=1`,
      server: getServer()
    })

    expect(getByRole(document, 'textbox', { name: 'Years' })).toHaveValue('2')
    expect(getByRole(document, 'textbox', { name: 'Months' })).toHaveValue('6')
  })

  test('redirects after valid submission', async () => {
    mockMarineLicence(mockMarineLicenceApplication)

    const response = await makePostRequest({
      url: `${marineLicenceRoutes.MARINE_LICENCE_DURATION}?site=1&activity=1`,
      server: getServer(),
      formData: {
        'activity-duration-years': '2',
        'activity-duration-months': '6'
      }
    })

    expect(response.statusCode).toBe(statusCodes.redirect)
    expect(response.headers.location).toBe(
      '/marine-licence/review-site-details?site=1&activity=1'
    )
  })
})
