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

describe('Project name', () => {
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
      'Public register'
    )
    expect(
      getByRole(document, 'link', {
        name: 'public register (opens in new tab)'
      })
    ).toHaveAttribute(
      'href',
      'https://marinelicensing.marinemanagement.org.uk/mmo/fox/live/MMO_PUBLIC_REGISTER'
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
          'Do you believe the information you have provided should be withheld from the public register?',
        inputLabel: 'Yes'
      })
    ).not.toBeChecked()
  })

  test('public register decision set', async () => {
    mockExemption({
      ...exemption,
      publicRegister: { consent: 'yes', reason: 'Test reason' }
    })
    const document = await loadPage({
      requestUrl: routes.PUBLIC_REGISTER,
      server: getServer()
    })
    expect(
      getInputInFieldset({
        document,
        fieldsetLabel:
          'Do you believe the information you have provided should be withheld from the public register?',
        inputLabel: 'Yes'
      })
    ).toBeChecked()
    expectInputValue({
      document,
      inputLabel: 'Provide details of why the information should be withheld',
      value: 'Test reason'
    })
  })

  test('should show a validation error when submitted without a decision', async () => {
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
        'Do you believe the information you have provided should be withheld from the public register?',
      errorMessage:
        'Select whether you believe your information should be withheld from the public register'
    })
  })
})
