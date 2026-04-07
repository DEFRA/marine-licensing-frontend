import { getByRole, getByText } from '@testing-library/dom'
import { marineLicenceRoutes } from '~/src/server/common/constants/routes.js'
import {
  mockMarineLicence,
  setupTestServer
} from '~/tests/integration/shared/test-setup-helpers.js'
import { loadPage, submitForm } from '~/tests/integration/shared/app-server.js'
import {
  expectFieldsetError,
  expectInputValue
} from '~/tests/integration/shared/expect-utils.js'
import { getInputInFieldset } from '~/tests/integration/shared/dom-helpers.js'

describe('Other authorities', () => {
  const getServer = setupTestServer()
  const marineLicence = {
    id: 'marine-licence-123',
    projectName: 'Test Marine Project',
    otherAuthorities: { agree: undefined, details: '' }
  }

  test('page elements', async () => {
    mockMarineLicence(marineLicence)

    const document = await loadPage({
      requestUrl: marineLicenceRoutes.MARINE_LICENCE_OTHER_AUTHORITIES,
      server: getServer()
    })

    expect(getByText(document, 'Test Marine Project')).toBeInTheDocument()
    expect(getByRole(document, 'link', { name: 'Back' })).toHaveAttribute(
      'href',
      marineLicenceRoutes.MARINE_LICENCE_TASK_LIST
    )
    expect(getByRole(document, 'heading', { level: 1 })).toHaveTextContent(
      'Have you applied to, or got permission from, any other authorities in relation to this project?'
    )
    getByRole(document, 'button', { name: 'Save and continue' })
    expect(getByRole(document, 'link', { name: 'Cancel' })).toHaveAttribute(
      'href',
      marineLicenceRoutes.MARINE_LICENCE_TASK_LIST
    )
  })

  test('back link from Check Your Answers', async () => {
    mockMarineLicence(marineLicence)

    const document = await loadPage({
      requestUrl:
        marineLicenceRoutes.MARINE_LICENCE_OTHER_AUTHORITIES +
        '?from=check-your-answers',
      server: getServer()
    })

    expect(getByRole(document, 'link', { name: 'Back' })).toHaveAttribute(
      'href',
      marineLicenceRoutes.MARINE_LICENCE_CHECK_YOUR_ANSWERS
    )
  })

  test('form state when no decision set', async () => {
    mockMarineLicence(marineLicence)

    const document = await loadPage({
      requestUrl: marineLicenceRoutes.MARINE_LICENCE_OTHER_AUTHORITIES,
      server: getServer()
    })

    expect(
      getInputInFieldset({
        document,
        fieldsetLabel:
          'Have you applied to, or got permission from, any other authorities in relation to this project?',
        inputLabel: 'Yes',
        findByHeading: true
      })
    ).not.toBeChecked()
    expect(
      getInputInFieldset({
        document,
        fieldsetLabel:
          'Have you applied to, or got permission from, any other authorities in relation to this project?',
        inputLabel: 'No',
        findByHeading: true
      })
    ).not.toBeChecked()
  })

  test('form state when decision and details set', async () => {
    mockMarineLicence({
      ...marineLicence,
      otherAuthorities: {
        agree: 'yes',
        details: 'Applied to harbour authority'
      }
    })

    const document = await loadPage({
      requestUrl: marineLicenceRoutes.MARINE_LICENCE_OTHER_AUTHORITIES,
      server: getServer()
    })

    expect(
      getInputInFieldset({
        document,
        fieldsetLabel:
          'Have you applied to, or got permission from, any other authorities in relation to this project?',
        inputLabel: 'Yes',
        findByHeading: true
      })
    ).toBeChecked()
    expectInputValue({
      document,
      inputLabel:
        'Provide details of the organisations, relevant contact details and any reference numbers',
      value: 'Applied to harbour authority'
    })
  })

  test('should show a validation error when submitted without a decision', async () => {
    mockMarineLicence(marineLicence)

    const submitOtherAuthoritiesForm = async (formData) => {
      const { document } = await submitForm({
        requestUrl: marineLicenceRoutes.MARINE_LICENCE_OTHER_AUTHORITIES,
        server: getServer(),
        formData
      })
      return document
    }

    const document = await submitOtherAuthoritiesForm({ details: '' })

    expectFieldsetError({
      document,
      fieldsetLabel:
        'Have you applied to, or got permission from, any other authorities in relation to this project?',
      errorMessage:
        'Select whether you have applied to, or got permission from, any other authorities',
      findByHeading: true
    })
  })

  test('should show a validation error when "yes" is selected but details are missing', async () => {
    mockMarineLicence(marineLicence)

    const submitOtherAuthoritiesForm = async (formData) => {
      const { document } = await submitForm({
        requestUrl: marineLicenceRoutes.MARINE_LICENCE_OTHER_AUTHORITIES,
        server: getServer(),
        formData
      })
      return document
    }

    const document = await submitOtherAuthoritiesForm({
      agree: 'yes',
      details: ''
    })

    expectFieldsetError({
      document,
      fieldsetLabel:
        'Have you applied to, or got permission from, any other authorities in relation to this project?',
      errorMessage: 'Provide details of the other authorities',
      findByHeading: true
    })
  })
})
