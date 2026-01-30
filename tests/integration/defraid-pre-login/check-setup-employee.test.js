import {
  mockExemption,
  setupTestServer
} from '~/tests/integration/shared/test-setup-helpers.js'
import { routes } from '~/src/server/common/constants/routes.js'
import { loadPage, submitForm } from '~/tests/integration/shared/app-server.js'
import { expectFieldsetError } from '~/tests/integration/shared/expect-utils.js'
import { within } from '@testing-library/dom'

describe('Pre-login - Check set-up (employee)', () => {
  const getServer = setupTestServer()

  it('should display page "Check you are set up to apply for your organisation"', async () => {
    const document = await loadPage({
      requestUrl: routes.preLogin.CHECK_SETUP_EMPLOYEE,
      server: getServer()
    })
    const pageHeading = within(document).getByRole('heading', {
      level: 1,
      name: 'Check you are set up to apply for your organisation'
    })
    expect(pageHeading).toBeInTheDocument()
  })

  test('should show a validation error when submitted without a selection', async () => {
    mockExemption({})
    const submitPageForm = async (formData) => {
      const { document } = await submitForm({
        requestUrl: routes.preLogin.CHECK_SETUP_EMPLOYEE,
        server: getServer(),
        formData
      })
      return document
    }
    const document = await submitPageForm({})
    expectFieldsetError({
      document,
      fieldsetLabel: 'Do you have a Defra account for your organisation?',
      errorMessage: 'Select if you have a Defra account for your organisation'
    })
  })
})
