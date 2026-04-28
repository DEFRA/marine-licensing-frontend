import { getByRole, getByText } from '@testing-library/dom'
import { marineLicenceRoutes } from '~/src/server/common/constants/routes.js'
import {
  mockMarineLicence,
  setupTestServer
} from '~/tests/integration/shared/test-setup-helpers.js'
import { loadPage, submitForm } from '~/tests/integration/shared/app-server.js'
import { statusCodes } from '~/src/server/common/constants/status-codes.js'
import { mockMarineLicenceApplication } from '#src/server/test-helpers/mocks/marine-licence-mocks.js'
import { makePostRequest } from '~/src/server/test-helpers/server-requests.js'
import {
  expectFieldsetError,
  expectInputValue
} from '~/tests/integration/shared/expect-utils.js'

describe('Type of activity (marine licence)', () => {
  const getServer = setupTestServer()

  const variantUsedForTesting = 'what-are-you-constructing'
  const maxLengthOtherActivity = 'a'.repeat(1001)

  test('page elements', async () => {
    mockMarineLicence(mockMarineLicenceApplication)

    const document = await loadPage({
      requestUrl: `/marine-licence/activity-details/${variantUsedForTesting}?site=1&activity=1`,
      server: getServer()
    })

    expect(
      getByText(document, mockMarineLicenceApplication.projectName)
    ).toBeInTheDocument()

    expect(getByText(document, 'Site 1 - Activity 1')).toBeInTheDocument()

    expect(getByRole(document, 'link', { name: 'Back' })).toHaveAttribute(
      'href',
      `${marineLicenceRoutes.MARINE_LICENCE_TYPE_OF_ACTIVITY}?site=1&activity=1`
    )

    expect(getByRole(document, 'heading', { level: 1 })).toHaveTextContent(
      'What are you constructing?'
    )

    expect(
      getByRole(document, 'checkbox', {
        name: 'Aquaculture trestles or fixed walkways'
      })
    ).toBeChecked()

    expect(
      getByRole(document, 'button', { name: 'Save and continue' })
    ).toBeInTheDocument()
  })

  test('correct back link from Review Site Details', async () => {
    const document = await loadPage({
      requestUrl: `/marine-licence/activity-details/${variantUsedForTesting}?action=change&site=1&activity=1`,
      server: getServer()
    })
    expect(getByRole(document, 'link', { name: 'Back' })).toHaveAttribute(
      'href',
      `${marineLicenceRoutes.MARINE_LICENCE_REVIEW_SITE_DETAILS}#activity-details-site-1-activity-1`
    )
  })

  test('pre-selects correct checkboxes', async () => {
    mockMarineLicence({
      ...mockMarineLicenceApplication,
      siteDetails: [
        {
          ...mockMarineLicenceApplication.siteDetails[0],
          activityDetails: [
            {
              ...mockMarineLicenceApplication.siteDetails[0].activityDetails[0],
              activities: {
                selections: ['CON2', 'other'],
                otherActivity: 'test activity'
              }
            }
          ]
        }
      ]
    })

    const document = await loadPage({
      requestUrl: `/marine-licence/activity-details/${variantUsedForTesting}?site=1&activity=1`,
      server: getServer()
    })

    expect(
      getByRole(document, 'checkbox', {
        name: 'Aquaculture trestles or fixed walkways'
      })
    ).not.toBeChecked()

    expect(
      getByRole(document, 'checkbox', {
        name: 'Piled or fixed aquaculture structures'
      })
    ).toBeChecked()

    expect(
      getByRole(document, 'checkbox', {
        name: 'Other structures not listed above'
      })
    ).toBeChecked()

    expectInputValue({
      document,
      inputLabel: 'Provide details',
      value: 'test activity'
    })
  })

  test('redirects after valid submission', async () => {
    mockMarineLicence(mockMarineLicenceApplication)

    const response = await makePostRequest({
      url: `/marine-licence/activity-details/${variantUsedForTesting}?site=1&activity=1`,
      server: getServer(),
      formData: {
        activities: ['CON1'],
        otherActivity: 'Test activity'
      }
    })

    expect(response.statusCode).toBe(statusCodes.redirect)
    expect(response.headers.location).toBe(
      `${marineLicenceRoutes.MARINE_LICENCE_REVIEW_SITE_DETAILS}#activity-details-site-1-activity-1`
    )
  })

  test('show error after invalid submission of empty list', async () => {
    mockMarineLicence(mockMarineLicenceApplication)

    const { document } = await submitForm({
      requestUrl: `/marine-licence/activity-details/${variantUsedForTesting}?site=1&activity=1`,
      server: getServer(),
      formData: {}
    })

    expectFieldsetError({
      document,
      fieldsetLabel: 'What are you constructing?',
      errorMessage: 'Select at least one type of structure',
      findByHeading: true,
      useErrorClass: true
    })
  })

  test('show error after invalid submission of other option', async () => {
    mockMarineLicence(mockMarineLicenceApplication)

    const { document } = await submitForm({
      requestUrl: `/marine-licence/activity-details/${variantUsedForTesting}?site=1&activity=1`,
      server: getServer(),
      formData: { activities: 'other' }
    })

    expectFieldsetError({
      document,
      fieldsetLabel: 'What are you constructing?',
      errorMessage: 'Enter details of the other structures',
      findByHeading: true,
      useErrorClass: true
    })
  })

  test('show error when other structures exceeds 1000 characters', async () => {
    mockMarineLicence(mockMarineLicenceApplication)

    const { document } = await submitForm({
      requestUrl: `/marine-licence/activity-details/${variantUsedForTesting}?site=1&activity=1`,
      server: getServer(),
      formData: { activities: 'other', otherActivity: maxLengthOtherActivity }
    })

    expectFieldsetError({
      document,
      fieldsetLabel: 'What are you constructing?',
      errorMessage:
        'Details of other structures must be 1000 characters or less',
      findByHeading: true,
      useErrorClass: true
    })
  })

  test('show error when other deposits exceeds 1000 characters', async () => {
    const depositApplication = structuredClone(mockMarineLicenceApplication)
    depositApplication.siteDetails[0].activityDetails[0].activityType =
      'deposit'
    mockMarineLicence(depositApplication)

    const { document } = await submitForm({
      requestUrl:
        '/marine-licence/activity-details/what-deposit-activity-are-you-continuing?site=1&activity=1',
      server: getServer(),
      formData: { activities: 'other', otherActivity: maxLengthOtherActivity }
    })

    expectFieldsetError({
      document,
      fieldsetLabel: 'What deposit activity are you continuing?',
      errorMessage: 'Details of other deposits must be 1000 characters or less',
      findByHeading: true,
      useErrorClass: true
    })
  })

  test('show error when other substances or objects exceeds 1000 characters', async () => {
    const removalApplication = structuredClone(mockMarineLicenceApplication)
    removalApplication.siteDetails[0].activityDetails[0].activityType =
      'removal'
    mockMarineLicence(removalApplication)

    const { document } = await submitForm({
      requestUrl:
        '/marine-licence/activity-details/what-are-you-removing-for-the-first-time?site=1&activity=1',
      server: getServer(),
      formData: { activities: 'other', otherActivity: maxLengthOtherActivity }
    })

    expectFieldsetError({
      document,
      fieldsetLabel:
        'What are you removing for the first time on a one off basis?',
      errorMessage:
        'Details of the other substances or objects must be 1000 characters or less',
      findByHeading: true,
      useErrorClass: true
    })
  })
})
