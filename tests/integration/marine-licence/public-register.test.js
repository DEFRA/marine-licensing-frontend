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

describe('Public register', () => {
  const getServer = setupTestServer()
  const marineLicence = {
    id: 'marine-licence-123',
    projectName: 'Test Marine Project',
    publicRegister: { consent: undefined, reason: '' }
  }

  test('page elements', async () => {
    mockMarineLicence(marineLicence)

    const document = await loadPage({
      requestUrl: marineLicenceRoutes.MARINE_LICENCE_PUBLIC_REGISTER,
      server: getServer()
    })

    expect(getByText(document, 'Test Marine Project')).toBeInTheDocument()
    expect(getByRole(document, 'link', { name: 'Back' })).toHaveAttribute(
      'href',
      marineLicenceRoutes.MARINE_LICENCE_TASK_LIST
    )
    expect(getByRole(document, 'heading', { level: 1 })).toHaveTextContent(
      'Sharing your project information publicly'
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
        marineLicenceRoutes.MARINE_LICENCE_PUBLIC_REGISTER +
        '?from=check-your-answers',
      server: getServer()
    })

    expect(getByRole(document, 'link', { name: 'Back' })).toHaveAttribute(
      'href',
      marineLicenceRoutes.MARINE_LICENCE_CHECK_YOUR_ANSWERS
    )
  })

  test('public register form state when no decision set', async () => {
    mockMarineLicence(marineLicence)

    const document = await loadPage({
      requestUrl: marineLicenceRoutes.MARINE_LICENCE_PUBLIC_REGISTER,
      server: getServer()
    })

    expect(
      getInputInFieldset({
        document,
        fieldsetLabel: 'Sharing your project information publicly',
        inputLabel: 'Yes',
        findByHeading: true
      })
    ).not.toBeChecked()
    expect(
      getInputInFieldset({
        document,
        fieldsetLabel: 'Sharing your project information publicly',
        inputLabel: 'No',
        findByHeading: true
      })
    ).not.toBeChecked()
  })

  test('public register form state when consent is yes', async () => {
    mockMarineLicence({
      ...marineLicence,
      publicRegister: { consent: 'yes' }
    })

    const document = await loadPage({
      requestUrl: marineLicenceRoutes.MARINE_LICENCE_PUBLIC_REGISTER,
      server: getServer()
    })

    expect(
      getInputInFieldset({
        document,
        fieldsetLabel: 'Sharing your project information publicly',
        inputLabel: 'Yes',
        findByHeading: true
      })
    ).toBeChecked()
    expect(
      getInputInFieldset({
        document,
        fieldsetLabel: 'Sharing your project information publicly',
        inputLabel: 'No',
        findByHeading: true
      })
    ).not.toBeChecked()
  })

  test('public register form state when consent is no and reason set', async () => {
    mockMarineLicence({
      ...marineLicence,
      publicRegister: {
        consent: 'no',
        reason: 'Some reason'
      }
    })

    const document = await loadPage({
      requestUrl: marineLicenceRoutes.MARINE_LICENCE_PUBLIC_REGISTER,
      server: getServer()
    })

    expect(
      getInputInFieldset({
        document,
        fieldsetLabel: 'Sharing your project information publicly',
        inputLabel: 'No',
        findByHeading: true
      })
    ).toBeChecked()
    expectInputValue({
      document,
      inputLabel:
        'Provide details of why you do not consent to your project information being published',
      value: 'Some reason'
    })
  })

  test('should show a validation error when submitted without a consent decision', async () => {
    mockMarineLicence(marineLicence)

    const submitPublicRegisterForm = async (formData) => {
      const { document } = await submitForm({
        requestUrl: marineLicenceRoutes.MARINE_LICENCE_PUBLIC_REGISTER,
        server: getServer(),
        formData
      })
      return document
    }

    const document = await submitPublicRegisterForm({ reason: '' })

    expectFieldsetError({
      document,
      fieldsetLabel: 'Sharing your project information publicly',
      errorMessage:
        'Select whether you consent to the MMO publishing your project information publicly',
      findByHeading: true
    })
  })

  test('should show a validation error when "no" is selected but reason is missing', async () => {
    mockMarineLicence(marineLicence)

    const submitPublicRegisterForm = async (formData) => {
      const { document } = await submitForm({
        requestUrl: marineLicenceRoutes.MARINE_LICENCE_PUBLIC_REGISTER,
        server: getServer(),
        formData
      })
      return document
    }

    const document = await submitPublicRegisterForm({
      consent: 'no',
      reason: ''
    })

    expectFieldsetError({
      document,
      fieldsetLabel: 'Sharing your project information publicly',
      errorMessage:
        'Provide details of why you do not consent to your project information being published',
      findByHeading: true,
      useErrorClass: true
    })
  })
})
