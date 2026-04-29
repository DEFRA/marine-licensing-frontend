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

describe('Completion date (marine licence)', () => {
  const getServer = setupTestServer()
  const pageUrl = `${marineLicenceRoutes.MARINE_LICENCE_COMPLETION_DATE}?site=1&activity=1`
  const expectedBackLink = `${marineLicenceRoutes.MARINE_LICENCE_REVIEW_SITE_DETAILS}#activity-details-site-1-activity-1`
  const fieldsetLabel =
    'Does any part of the activity need to be completed by a certain date?'

  const marineLicenceWithCompletionDate = (completionDate) => ({
    ...mockMarineLicenceApplication,
    siteDetails: [
      {
        ...mockMarineLicenceApplication.siteDetails[0],
        activityDetails: [
          {
            ...mockMarineLicenceApplication.siteDetails[0].activityDetails[0],
            completionDate
          }
        ]
      }
    ]
  })

  test('page elements', async () => {
    mockMarineLicence(marineLicenceWithCompletionDate({}))

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

  test('completion date form state when no decision set', async () => {
    mockMarineLicence(marineLicenceWithCompletionDate({}))

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

  test('completion date form state when yes with reason pre-populated', async () => {
    mockMarineLicence(
      marineLicenceWithCompletionDate({
        date: 'yes',
        reason: 'Test reason'
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
      inputLabel: 'Provide reasons for the completion date',
      value: 'Test reason'
    })
  })

  test('should show a validation error when submitted without a decision', async () => {
    mockMarineLicence(marineLicenceWithCompletionDate({}))

    const { document } = await submitForm({
      requestUrl: pageUrl,
      server: getServer(),
      formData: { reason: '' }
    })

    expectFieldsetError({
      document,
      fieldsetLabel,
      errorMessage:
        'Select whether any part of the project needs to be completed by a certain date',
      findByHeading: true
    })
  })

  test('should show a validation error when "yes" is selected but reason is missing', async () => {
    mockMarineLicence(marineLicenceWithCompletionDate({}))

    const { document } = await submitForm({
      requestUrl: pageUrl,
      server: getServer(),
      formData: { date: 'yes', reason: '' }
    })

    expectFieldsetError({
      document,
      fieldsetLabel,
      errorMessage: 'Provide reasons for the completion date',
      findByHeading: true,
      useErrorClass: true
    })
  })

  test('redirects to review site details with anchor after submission', async () => {
    mockMarineLicence(marineLicenceWithCompletionDate({}))

    const response = await makePostRequest({
      url: pageUrl,
      server: getServer(),
      formData: { date: 'no' }
    })

    expect(response.statusCode).toBe(statusCodes.redirect)
    expect(response.headers.location).toBe(expectedBackLink)
  })
})
