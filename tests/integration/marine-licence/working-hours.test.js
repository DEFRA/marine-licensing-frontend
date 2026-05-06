import { getByRole, getByText } from '@testing-library/dom'
import { marineLicenceRoutes } from '~/src/server/common/constants/routes.js'
import {
  mockMarineLicence,
  setupTestServer
} from '~/tests/integration/shared/test-setup-helpers.js'
import { loadPage, submitForm } from '~/tests/integration/shared/app-server.js'
import { makePostRequest } from '~/src/server/test-helpers/server-requests.js'
import { statusCodes } from '~/src/server/common/constants/status-codes.js'
import { mockMarineLicenceApplication } from '#src/server/test-helpers/mocks/marine-licence-mocks.js'
import { validateErrors } from '~/tests/integration/shared/expect-utils.js'

describe('Working hours (marine licence)', () => {
  const getServer = setupTestServer()
  const pageUrl = `${marineLicenceRoutes.MARINE_LICENCE_WORKING_HOURS}?site=1&activity=1`
  const expectedBackLink = `${marineLicenceRoutes.MARINE_LICENCE_REVIEW_SITE_DETAILS}#activity-details-site-1-activity-1`

  test('page elements', async () => {
    mockMarineLicence(mockMarineLicenceApplication)

    const document = await loadPage({
      requestUrl: pageUrl,
      server: getServer()
    })

    expect(
      getByText(document, mockMarineLicenceApplication.projectName)
    ).toBeInTheDocument()

    expect(getByText(document, 'Site 1 - Activity 1')).toBeInTheDocument()

    expect(getByRole(document, 'link', { name: 'Back' })).toHaveAttribute(
      'href',
      expectedBackLink
    )

    expect(getByRole(document, 'heading', { level: 1 })).toHaveTextContent(
      'What are the proposed working hours?'
    )
    expect(
      getByRole(document, 'textbox', {
        name: /What are the proposed working hours/i
      })
    ).toBeInTheDocument()

    expect(
      getByRole(document, 'button', { name: 'Save and continue' })
    ).toBeInTheDocument()
  })

  test('pre-populates textarea with existing value', async () => {
    mockMarineLicence(mockMarineLicenceApplication)

    const document = await loadPage({
      requestUrl: pageUrl,
      server: getServer()
    })

    expect(document.querySelector('textarea#workingHours').textContent).toBe(
      mockMarineLicenceApplication.siteDetails[0].activityDetails[0]
        .workingHours
    )
  })

  test('shows validation error when submitted empty', async () => {
    mockMarineLicence(mockMarineLicenceApplication)

    const { document } = await submitForm({
      requestUrl: pageUrl,
      server: getServer(),
      formData: { workingHours: '' }
    })

    validateErrors(
      [
        {
          field: 'workingHours',
          message: 'Enter the proposed working hours'
        }
      ],
      document
    )
  })

  test('redirects to review site details with anchor after submission', async () => {
    mockMarineLicence(mockMarineLicenceApplication)

    const response = await makePostRequest({
      url: pageUrl,
      server: getServer(),
      formData: { workingHours: 'Monday to Friday, 9am to 5pm' }
    })

    expect(response.statusCode).toBe(statusCodes.redirect)
    expect(response.headers.location).toBe(expectedBackLink)
  })
})
