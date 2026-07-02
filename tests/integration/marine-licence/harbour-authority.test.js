import { getByRole, getByText } from '@testing-library/dom'
import { marineLicenceRoutes } from '~/src/server/common/constants/routes.js'
import { HARBOUR_AUTHORITY_MAP_URL } from '~/src/server/common/validation/harbour-authority/constants.js'
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

describe('Harbour authority', () => {
  const getServer = setupTestServer()
  const marineLicence = {
    id: 'marine-licence-123',
    projectName: 'Test Marine Project',
    harbourAuthority: { area: undefined, details: '' }
  }

  test('page elements', async () => {
    mockMarineLicence(marineLicence)

    const document = await loadPage({
      requestUrl: marineLicenceRoutes.MARINE_LICENCE_HARBOUR_AUTHORITY,
      server: getServer()
    })

    expect(getByText(document, 'Test Marine Project')).toBeInTheDocument()
    expect(getByRole(document, 'link', { name: 'Back' })).toHaveAttribute(
      'href',
      marineLicenceRoutes.MARINE_LICENCE_TASK_LIST
    )
    expect(getByRole(document, 'heading', { level: 1 })).toHaveTextContent(
      'Is your project located in a harbour authority area?'
    )
    getByRole(document, 'button', { name: 'Save and continue' })
    expect(getByRole(document, 'link', { name: 'Cancel' })).toHaveAttribute(
      'href',
      marineLicenceRoutes.MARINE_LICENCE_TASK_LIST
    )
    expect(
      getByRole(document, 'link', {
        name: 'marine licensing interactive map (opens in new tab)'
      })
    ).toHaveAttribute('href', HARBOUR_AUTHORITY_MAP_URL)
  })

  test('back link from Check Your Answers', async () => {
    mockMarineLicence(marineLicence)

    const document = await loadPage({
      requestUrl:
        marineLicenceRoutes.MARINE_LICENCE_HARBOUR_AUTHORITY +
        '?from=check-your-answers',
      server: getServer()
    })

    expect(getByRole(document, 'link', { name: 'Back' })).toHaveAttribute(
      'href',
      marineLicenceRoutes.MARINE_LICENCE_CHECK_YOUR_ANSWERS +
        '#other-permissions-card'
    )
  })

  test('form state when no decision set', async () => {
    mockMarineLicence(marineLicence)

    const document = await loadPage({
      requestUrl: marineLicenceRoutes.MARINE_LICENCE_HARBOUR_AUTHORITY,
      server: getServer()
    })

    expect(
      getInputInFieldset({
        document,
        fieldsetLabel: 'Is your project located in a harbour authority area?',
        inputLabel: 'Yes',
        findByHeading: true
      })
    ).not.toBeChecked()
    expect(
      getInputInFieldset({
        document,
        fieldsetLabel: 'Is your project located in a harbour authority area?',
        inputLabel: 'No',
        findByHeading: true
      })
    ).not.toBeChecked()
  })

  test('form state when decision and harbour area set', async () => {
    mockMarineLicence({
      ...marineLicence,
      harbourAuthority: {
        area: 'yes',
        details: 'The Port of Tyne harbour authority area'
      }
    })

    const document = await loadPage({
      requestUrl: marineLicenceRoutes.MARINE_LICENCE_HARBOUR_AUTHORITY,
      server: getServer()
    })

    expect(
      getInputInFieldset({
        document,
        fieldsetLabel: 'Is your project located in a harbour authority area?',
        inputLabel: 'Yes',
        findByHeading: true
      })
    ).toBeChecked()
    expectInputValue({
      document,
      inputLabel: 'Provide details of the harbour authority',
      value: 'The Port of Tyne harbour authority area'
    })
  })

  test('should show a validation error when submitted without a decision', async () => {
    mockMarineLicence(marineLicence)

    const submitHarbourAuthorityForm = async (formData) => {
      const { document } = await submitForm({
        requestUrl: marineLicenceRoutes.MARINE_LICENCE_HARBOUR_AUTHORITY,
        server: getServer(),
        formData
      })
      return document
    }

    const document = await submitHarbourAuthorityForm({ area: '' })

    expectFieldsetError({
      document,
      fieldsetLabel: 'Is your project located in a harbour authority area?',
      errorMessage:
        'Select whether your project is located in a harbour authority area',
      findByHeading: true
    })
  })

  test('should show a validation error when "yes" is selected but harbour area is missing', async () => {
    mockMarineLicence(marineLicence)

    const submitHarbourAuthorityForm = async (formData) => {
      const { document } = await submitForm({
        requestUrl: marineLicenceRoutes.MARINE_LICENCE_HARBOUR_AUTHORITY,
        server: getServer(),
        formData
      })
      return document
    }

    const document = await submitHarbourAuthorityForm({
      area: 'yes',
      details: ''
    })

    expectFieldsetError({
      document,
      fieldsetLabel: 'Is your project located in a harbour authority area?',
      errorMessage: 'Enter details of the harbour authority',
      findByHeading: true
    })
  })
})
