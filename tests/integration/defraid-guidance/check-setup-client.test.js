import { setupTestServer } from '~/tests/integration/shared/test-setup-helpers.js'
import { routes } from '~/src/server/common/constants/routes.js'
import { loadPage, submitForm } from '~/tests/integration/shared/app-server.js'
import { expectFieldsetError } from '~/tests/integration/shared/expect-utils.js'
import { getByLabelText, within } from '@testing-library/dom'
import { statusCodes } from '~/src/server/common/constants/status-codes.js'

vi.mock('#src/server/common/helpers/defraid-guidance/session-cache.js', () => {
  const cache = {}
  return {
    defraIdGuidanceUserSession: {
      set: async ({ request, key, value }) => (cache[key] = value),
      get: async ({ request, key }) => cache[key]
    }
  }
})

describe('Guidance - Check set-up (client)', () => {
  const getServer = setupTestServer()
  const submitPageForm = async (formData) => {
    const { document } = await submitForm({
      requestUrl: routes.defraIdGuidance.CHECK_SETUP_CLIENT,
      server: getServer(),
      formData
    })
    return document
  }

  it('should display page "Check you are set up to apply for your client"', async () => {
    const document = await loadPage({
      requestUrl: routes.defraIdGuidance.CHECK_SETUP_CLIENT,
      server: getServer()
    })
    const pageHeading = within(document).getByRole('heading', {
      level: 1,
      name: 'Check you are set up to apply for your client'
    })
    expect(pageHeading).toBeInTheDocument()
  })

  it('should display a back link to who is the exemption for', async () => {
    const document = await loadPage({
      requestUrl: routes.defraIdGuidance.CHECK_SETUP_CLIENT,
      server: getServer()
    })
    const backLink = within(document).getByRole('link', { name: 'Back' })
    expect(backLink).toBeInTheDocument()
    expect(backLink).toHaveAttribute(
      'href',
      routes.defraIdGuidance.WHO_IS_EXEMPTION_FOR
    )
  })

  test('should show a validation error when submitted without a selection', async () => {
    const document = await submitPageForm({})
    expectFieldsetError({
      document,
      fieldsetLabel: 'Has your client fully linked you to their Defra account?',
      errorMessage:
        'Select whether your client has fully linked you to their Defra account'
    })
  })

  test('should redirect to sign-in when yes is selected', async () => {
    const { response } = await submitForm({
      requestUrl: routes.defraIdGuidance.CHECK_SETUP_CLIENT,
      server: getServer(),
      formData: { checkSetupClient: 'yes' }
    })
    expect(response.statusCode).toBe(statusCodes.redirect)
    expect(response.headers.location).toBe(routes.SIGNIN)
  })

  test('should redirect to add-to-client-account when no is selected', async () => {
    const { response } = await submitForm({
      requestUrl: routes.defraIdGuidance.CHECK_SETUP_CLIENT,
      server: getServer(),
      formData: { checkSetupClient: 'no' }
    })
    expect(response.statusCode).toBe(statusCodes.redirect)
    expect(response.headers.location).toBe(
      routes.defraIdGuidance.ADD_TO_CLIENT_ACCOUNT
    )
  })

  test('should remember the users selected option', async () => {
    await submitPageForm({
      checkSetupClient: 'yes'
    })
    const document = await loadPage({
      requestUrl: routes.defraIdGuidance.CHECK_SETUP_CLIENT,
      server: getServer()
    })
    const radioButton = getByLabelText(document, 'Yes')
    expect(radioButton).toBeChecked()
  })
})
