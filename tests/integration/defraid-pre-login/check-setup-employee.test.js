import { setupTestServer } from '~/tests/integration/shared/test-setup-helpers.js'
import { routes } from '~/src/server/common/constants/routes.js'
import { loadPage, submitForm } from '~/tests/integration/shared/app-server.js'
import { expectFieldsetError } from '~/tests/integration/shared/expect-utils.js'
import { getByLabelText, within } from '@testing-library/dom'

vi.mock('#src/server/common/helpers/defraid-pre-login/session-cache.js', () => {
  const cache = {}
  return {
    preloginUserSession: {
      set: async ({ request, key, value }) => (cache[key] = value),
      get: async ({ request, key }) => cache[key]
    }
  }
})

describe('Pre-login - Check set-up (employee)', () => {
  const getServer = setupTestServer()
  const submitPageForm = async (formData) => {
    const { document } = await submitForm({
      requestUrl: routes.preLogin.CHECK_SETUP_EMPLOYEE,
      server: getServer(),
      formData
    })
    return document
  }

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
    const document = await submitPageForm({})
    expectFieldsetError({
      document,
      fieldsetLabel: 'Do you have a Defra account for your organisation?',
      errorMessage: 'Select if you have a Defra account for your organisation'
    })
  })

  test('should remember the users selected option', async () => {
    await submitPageForm({
      checkSetupEmployee: 'register-new'
    })
    // reload the same page
    const document = await loadPage({
      requestUrl: routes.preLogin.CHECK_SETUP_EMPLOYEE,
      server: getServer()
    })
    const radioButton = getByLabelText(
      document,
      'No, I need to create a new account for my organisation'
    )
    expect(radioButton).toBeChecked()
  })
})
