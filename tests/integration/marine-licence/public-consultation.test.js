import { getByRole, getByText } from '@testing-library/dom'
import { marineLicenceRoutes } from '~/src/server/common/constants/routes.js'
import {
  mockMarineLicence,
  setupTestServer
} from '~/tests/integration/shared/test-setup-helpers.js'
import { loadPage, submitForm } from '~/tests/integration/shared/app-server.js'
import { makePostRequest } from '~/src/server/test-helpers/server-requests.js'
import { statusCodes } from '~/src/server/common/constants/status-codes.js'
import {
  expectFieldsetError,
  expectInputValue
} from '~/tests/integration/shared/expect-utils.js'
import { getInputInFieldset } from '~/tests/integration/shared/dom-helpers.js'

describe('Consultation and advertising', () => {
  const getServer = setupTestServer()
  const marineLicence = {
    id: 'marine-licence-123',
    projectName: 'Test Marine Project',
    publicConsultation: { consulted: undefined, details: '' }
  }

  test('page elements', async () => {
    mockMarineLicence(marineLicence)

    const document = await loadPage({
      requestUrl: marineLicenceRoutes.MARINE_LICENCE_PUBLIC_CONSULTATION,
      server: getServer()
    })

    expect(getByText(document, 'Test Marine Project')).toBeInTheDocument()
    expect(getByRole(document, 'link', { name: 'Back' })).toHaveAttribute(
      'href',
      marineLicenceRoutes.MARINE_LICENCE_TASK_LIST
    )
    expect(getByRole(document, 'heading', { level: 1 })).toHaveTextContent(
      'Have you consulted with any public groups or organisations before making this application?'
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
        marineLicenceRoutes.MARINE_LICENCE_PUBLIC_CONSULTATION +
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
      requestUrl: marineLicenceRoutes.MARINE_LICENCE_PUBLIC_CONSULTATION,
      server: getServer()
    })

    expect(
      getInputInFieldset({
        document,
        fieldsetLabel:
          'Have you consulted with any public groups or organisations before making this application?',
        inputLabel: 'Yes',
        findByHeading: true
      })
    ).not.toBeChecked()
    expect(
      getInputInFieldset({
        document,
        fieldsetLabel:
          'Have you consulted with any public groups or organisations before making this application?',
        inputLabel: 'No',
        findByHeading: true
      })
    ).not.toBeChecked()
  })

  test('form state when consulted is no', async () => {
    mockMarineLicence({
      ...marineLicence,
      publicConsultation: { consulted: 'no' }
    })

    const document = await loadPage({
      requestUrl: marineLicenceRoutes.MARINE_LICENCE_PUBLIC_CONSULTATION,
      server: getServer()
    })

    expect(
      getInputInFieldset({
        document,
        fieldsetLabel:
          'Have you consulted with any public groups or organisations before making this application?',
        inputLabel: 'No',
        findByHeading: true
      })
    ).toBeChecked()
    expect(
      getInputInFieldset({
        document,
        fieldsetLabel:
          'Have you consulted with any public groups or organisations before making this application?',
        inputLabel: 'Yes',
        findByHeading: true
      })
    ).not.toBeChecked()
  })

  test('form state when consulted is yes and details set', async () => {
    mockMarineLicence({
      ...marineLicence,
      publicConsultation: {
        consulted: 'yes',
        details: 'Spoke to local fishing association'
      }
    })

    const document = await loadPage({
      requestUrl: marineLicenceRoutes.MARINE_LICENCE_PUBLIC_CONSULTATION,
      server: getServer()
    })

    expect(
      getInputInFieldset({
        document,
        fieldsetLabel:
          'Have you consulted with any public groups or organisations before making this application?',
        inputLabel: 'Yes',
        findByHeading: true
      })
    ).toBeChecked()
    expectInputValue({
      document,
      inputLabel: 'Tell us who you consulted and what advice they gave',
      value: 'Spoke to local fishing association'
    })
  })

  test('redirects to task list after successful submission when consulted is no', async () => {
    mockMarineLicence(marineLicence)

    const response = await makePostRequest({
      url: marineLicenceRoutes.MARINE_LICENCE_PUBLIC_CONSULTATION,
      server: getServer(),
      formData: { consulted: 'no' }
    })

    expect(response.statusCode).toBe(statusCodes.redirect)
    expect(response.headers.location).toBe(
      marineLicenceRoutes.MARINE_LICENCE_TASK_LIST
    )
  })

  test('redirects to task list after successful submission when consulted is yes', async () => {
    mockMarineLicence(marineLicence)

    const response = await makePostRequest({
      url: marineLicenceRoutes.MARINE_LICENCE_PUBLIC_CONSULTATION,
      server: getServer(),
      formData: {
        consulted: 'yes',
        details: 'Spoke to local fishing association'
      }
    })

    expect(response.statusCode).toBe(statusCodes.redirect)
    expect(response.headers.location).toBe(
      marineLicenceRoutes.MARINE_LICENCE_TASK_LIST
    )
  })

  test('redirects to check your answers after submission when from=check-your-answers', async () => {
    mockMarineLicence(marineLicence)

    const response = await makePostRequest({
      url: `${marineLicenceRoutes.MARINE_LICENCE_PUBLIC_CONSULTATION}?from=check-your-answers`,
      server: getServer(),
      formData: { consulted: 'no' }
    })

    expect(response.statusCode).toBe(statusCodes.redirect)
    expect(response.headers.location).toBe(
      marineLicenceRoutes.MARINE_LICENCE_CHECK_YOUR_ANSWERS
    )
  })

  test('should show a validation error when submitted without a selection', async () => {
    mockMarineLicence(marineLicence)

    const submitConsultationForm = async (formData) => {
      const { document } = await submitForm({
        requestUrl: marineLicenceRoutes.MARINE_LICENCE_PUBLIC_CONSULTATION,
        server: getServer(),
        formData
      })
      return document
    }

    const document = await submitConsultationForm({ details: '' })

    expectFieldsetError({
      document,
      fieldsetLabel:
        'Have you consulted with any public groups or organisations before making this application?',
      errorMessage:
        'Select if you have consulted with any public groups or organisations before making this application',
      findByHeading: true
    })
  })

  test('should show a validation error when "yes" is selected but details is missing', async () => {
    mockMarineLicence(marineLicence)

    const submitConsultationForm = async (formData) => {
      const { document } = await submitForm({
        requestUrl: marineLicenceRoutes.MARINE_LICENCE_PUBLIC_CONSULTATION,
        server: getServer(),
        formData
      })
      return document
    }

    const document = await submitConsultationForm({
      consulted: 'yes',
      details: ''
    })

    expectFieldsetError({
      document,
      fieldsetLabel:
        'Have you consulted with any public groups or organisations before making this application?',
      errorMessage: 'Provide details of who you spoke to and the advice given',
      findByHeading: true,
      useErrorClass: true
    })
  })
})
