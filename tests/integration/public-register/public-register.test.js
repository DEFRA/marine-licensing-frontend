import { getByRole, getByText } from '@testing-library/dom'
import { routes } from '~/src/server/common/constants/routes.js'
import {
  mockExemption,
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
  const exemption = {
    id: 'test-exemption-123',
    projectName: 'Hammersmith pontoon maintenance'
  }

  test('page elements', async () => {
    mockExemption(exemption)
    const document = await loadPage({
      requestUrl: routes.PUBLIC_REGISTER,
      server: getServer()
    })
    expect(
      getByText(document, 'Hammersmith pontoon maintenance')
    ).toBeInTheDocument()
    expect(
      getByRole(document, 'link', {
        name: 'Back'
      })
    ).toHaveAttribute('href', routes.TASK_LIST)
    expect(getByRole(document, 'heading', { level: 1 })).toHaveTextContent(
      'Sharing your project information publicly'
    )
    expect(
      getByRole(document, 'link', {
        name: 'Explore Marine Plans (opens in new tab)'
      })
    ).toHaveAttribute(
      'href',
      'https://www.gov.uk/guidance/explore-marine-plans'
    )
    getByRole(document, 'button', {
      name: 'Save and continue'
    })
    expect(
      getByRole(document, 'link', {
        name: 'Cancel'
      })
    ).toHaveAttribute('href', routes.TASK_LIST)
  })

  test('public register from Check Your Answers', async () => {
    mockExemption(exemption)
    const document = await loadPage({
      requestUrl: routes.PUBLIC_REGISTER + '?from=check-your-answers',
      server: getServer()
    })
    expect(
      getByRole(document, 'link', {
        name: 'Back'
      })
    ).toHaveAttribute('href', routes.CHECK_YOUR_ANSWERS)
  })

  test('public register decision not set', async () => {
    mockExemption(exemption)
    const document = await loadPage({
      requestUrl: routes.PUBLIC_REGISTER,
      server: getServer()
    })
    expect(
      getInputInFieldset({
        document,
        fieldsetLabel:
          'Do you consent to the MMO publishing your project information publicly?',
        inputLabel: 'Yes'
      })
    ).not.toBeChecked()
  })

  test('public register decision set', async () => {
    mockExemption({
      ...exemption,
      publicRegister: { consent: 'no', reason: 'Test reason' }
    })
    const document = await loadPage({
      requestUrl: routes.PUBLIC_REGISTER,
      server: getServer()
    })
    expect(
      getInputInFieldset({
        document,
        fieldsetLabel:
          'Do you consent to the MMO publishing your project information publicly?',
        inputLabel: 'No'
      })
    ).toBeChecked()
    expectInputValue({
      document,
      inputLabel:
        'Provide details of why you do not consent to your project information being published',
      value: 'Test reason'
    })
  })

  test('should show a validation error when submitted without a decision', async () => {
    mockExemption(exemption)
    const submitProjectNameForm = async (formData) => {
      const { document } = await submitForm({
        requestUrl: routes.PUBLIC_REGISTER,
        server: getServer(),
        formData
      })
      return document
    }
    const document = await submitProjectNameForm({ reason: '' })
    expectFieldsetError({
      document,
      fieldsetLabel:
        'Do you consent to the MMO publishing your project information publicly?',
      errorMessage:
        'Select whether you consent to the MMO publishing your project information publicly'
    })
  })
})
