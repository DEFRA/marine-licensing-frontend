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
import {
  expectFieldsetError,
  expectInputValue
} from '~/tests/integration/shared/expect-utils.js'
import { getInputInFieldset } from '~/tests/integration/shared/dom-helpers.js'

describe('Months of activity (marine licence)', () => {
  const getServer = setupTestServer()
  const pageUrl = `${marineLicenceRoutes.MARINE_LICENCE_MONTHS_OF_ACTIVITY}?site=1&activity=1`
  const expectedBackLink = `${marineLicenceRoutes.MARINE_LICENCE_REVIEW_SITE_DETAILS}#activity-details-site-1-activity-1`
  const fieldsetLabel =
    'Will the activity be limited to specific months of the year?'

  const marineLicenceWithActivityMonths = (activityMonths) => ({
    ...mockMarineLicenceApplication,
    siteDetails: [
      {
        ...mockMarineLicenceApplication.siteDetails[0],
        activityDetails: [
          {
            ...mockMarineLicenceApplication.siteDetails[0].activityDetails[0],
            activityMonths
          }
        ]
      }
    ]
  })

  test('page elements', async () => {
    mockMarineLicence(marineLicenceWithActivityMonths({}))

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
      fieldsetLabel
    )
    expect(
      getByRole(document, 'button', { name: 'Save and continue' })
    ).toBeInTheDocument()
  })

  test('months of activity form state when no decision set', async () => {
    mockMarineLicence(marineLicenceWithActivityMonths({}))

    const document = await loadPage({
      requestUrl: pageUrl,
      server: getServer()
    })

    expect(
      getInputInFieldset({
        document,
        fieldsetLabel,
        inputLabel: 'Yes',
        findByHeading: true
      })
    ).not.toBeChecked()
    expect(
      getInputInFieldset({
        document,
        fieldsetLabel,
        inputLabel: 'No',
        findByHeading: true
      })
    ).not.toBeChecked()
  })

  test('months of activity form state when yes with details pre-populated', async () => {
    mockMarineLicence(
      marineLicenceWithActivityMonths({
        months: 'yes',
        details: 'January to March only'
      })
    )

    const document = await loadPage({
      requestUrl: pageUrl,
      server: getServer()
    })

    expect(
      getInputInFieldset({
        document,
        fieldsetLabel,
        inputLabel: 'Yes',
        findByHeading: true
      })
    ).toBeChecked()
    expectInputValue({
      document,
      inputLabel:
        'Provide details of which months the activity will happen and why',
      value: 'January to March only'
    })
  })

  test('should show a validation error when submitted without a decision', async () => {
    mockMarineLicence(marineLicenceWithActivityMonths({}))

    const { document } = await submitForm({
      requestUrl: pageUrl,
      server: getServer(),
      formData: { details: '' }
    })

    expectFieldsetError({
      document,
      fieldsetLabel,
      errorMessage:
        'Select whether the activity will be limited to specific months of the year',
      findByHeading: true
    })
  })

  test('should show a validation error when "yes" is selected but details is missing', async () => {
    mockMarineLicence(marineLicenceWithActivityMonths({}))

    const { document } = await submitForm({
      requestUrl: pageUrl,
      server: getServer(),
      formData: { months: 'yes', details: '' }
    })

    expectFieldsetError({
      document,
      fieldsetLabel,
      errorMessage:
        'Provide details of which months the activity will happen and why',
      findByHeading: true,
      useErrorClass: true
    })
  })

  test('redirects to review site details with anchor after submission', async () => {
    mockMarineLicence(marineLicenceWithActivityMonths({}))

    const response = await makePostRequest({
      url: pageUrl,
      server: getServer(),
      formData: { months: 'no' }
    })

    expect(response.statusCode).toBe(statusCodes.redirect)
    expect(response.headers.location).toBe(expectedBackLink)
  })
})
