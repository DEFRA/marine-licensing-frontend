import { vi } from 'vitest'
import { getByLabelText, getByRole, within } from '@testing-library/dom'
import { marineLicenceRoutes } from '~/src/server/common/constants/routes.js'
import { statusCodes } from '~/src/server/common/constants/status-codes.js'
import {
  mockMarineLicence,
  setupTestServer
} from '~/tests/integration/shared/test-setup-helpers.js'
import { authenticatedPatchRequest } from '~/src/server/common/helpers/authenticated-requests.js'
import { setMarineLicenceCache } from '~/src/server/common/helpers/marine-licence/session-cache/utils.js'
import { loadPage, submitForm } from '~/tests/integration/shared/app-server.js'
import { makeGetRequest } from '~/src/server/test-helpers/server-requests.js'
import { expectInputError } from '~/tests/integration/shared/expect-utils.js'

const PAGE_URL =
  marineLicenceRoutes.MARINE_LICENCE_PUBLIC_REGISTER_COMMERCIAL_CONFIDENTIALITY
const HEADING =
  'Withholding information for commercial or industrial confidentiality reasons'
const TEXTBOX_LABEL = 'Tell us what you want withheld and why'
const REASON_REQUIRED = 'Enter details of what you want withheld'
const REASON_TOO_LONG =
  'Details of what you want withheld must be 1000 characters or fewer'

describe('Public register: commercial confidentiality', () => {
  const getServer = setupTestServer()
  const choice = {
    withholdConsent: 'yes',
    withholdReason: 'commercialConfidentiality'
  }
  const marineLicence = {
    id: 'marine-licence-123',
    projectName: 'Test Marine Project',
    publicRegister: choice
  }

  const loadCommercialPage = (requestUrl = PAGE_URL) =>
    loadPage({ requestUrl, server: getServer() })

  const submitCommercialForm = (formData) =>
    submitForm({ requestUrl: PAGE_URL, server: getServer(), formData })

  beforeEach(() => {
    mockMarineLicence(marineLicence)
  })

  test('page content', async () => {
    const document = await loadCommercialPage()

    expect(document.title).toContain(HEADING)
    expect(document.title).not.toMatch(/^Error:/)
    expect(getByRole(document, 'heading', { level: 1 })).toHaveTextContent(
      HEADING
    )
    within(document.querySelector('.govuk-caption-l')).getByText(
      'Test Marine Project'
    )
    within(document.body).getByText(
      'This applies where publishing would harm a legitimate commercial interest that is protected by law. It may include:'
    )
    within(document.body).getByText(
      'sensitive operational or technical information that gives a competitive advantage'
    )
    within(document.body).getByText(
      /Wanting to keep it private, being open to public scrutiny or worrying about your reputation is not enough\./
    )
    within(document.body).getByText(
      /If we decide it does not, we will publish the information\./
    )

    const textbox = getByLabelText(document, TEXTBOX_LABEL)
    expect(textbox.tagName).toBe('TEXTAREA')
    expect(textbox).toHaveValue('')
    expect(document.querySelector('label[for="reason"]')).toHaveClass(
      'govuk-label--m'
    )
    const hint = document.querySelector('#reason-hint')
    within(hint).getByText('what information you want withheld')
    within(hint).getByText(
      'what harm would be caused by publishing it, and who would be affected'
    )
    within(hint).getByText('Enter a maximum of 1,000 characters')
    expect(document.querySelector('.govuk-character-count')).toBeNull()

    getByRole(document, 'button', { name: 'Save and continue' })
  })

  test('shows the saved reason when the user returns', async () => {
    mockMarineLicence({
      ...marineLicence,
      publicRegister: { ...choice, reason: 'Pricing details' }
    })

    const document = await loadCommercialPage()

    expect(getByLabelText(document, TEXTBOX_LABEL)).toHaveValue(
      'Pricing details'
    )
  })

  test('Back returns to the withholding information page and Cancel to the task list', async () => {
    const document = await loadCommercialPage()

    expect(getByRole(document, 'link', { name: 'Back' })).toHaveAttribute(
      'href',
      marineLicenceRoutes.MARINE_LICENCE_PUBLIC_REGISTER
    )
    expect(getByRole(document, 'link', { name: 'Cancel' })).toHaveAttribute(
      'href',
      marineLicenceRoutes.MARINE_LICENCE_TASK_LIST
    )
  })

  test('Back stays within check your answers and Cancel still goes to the task list', async () => {
    const document = await loadCommercialPage(
      `${PAGE_URL}?from=check-your-answers`
    )

    expect(getByRole(document, 'link', { name: 'Back' })).toHaveAttribute(
      'href',
      `${marineLicenceRoutes.MARINE_LICENCE_PUBLIC_REGISTER}?from=check-your-answers`
    )
    expect(getByRole(document, 'link', { name: 'Cancel' })).toHaveAttribute(
      'href',
      marineLicenceRoutes.MARINE_LICENCE_TASK_LIST
    )
  })

  test.each([
    { withholdConsent: 'yes', withholdReason: 'nationalSecurity' },
    { withholdConsent: 'no' },
    undefined
  ])(
    'sends the user back to the withholding information page when the reason is %o',
    async (publicRegister) => {
      mockMarineLicence({ ...marineLicence, publicRegister })

      const getResponse = await makeGetRequest({
        url: PAGE_URL,
        server: getServer()
      })
      const { response: postResponse } = await submitCommercialForm({
        reason: 'Pricing details'
      })

      for (const response of [getResponse, postResponse]) {
        expect(response.statusCode).toBe(statusCodes.redirect)
        expect(response.headers.location).toBe(
          marineLicenceRoutes.MARINE_LICENCE_PUBLIC_REGISTER
        )
      }
      expect(authenticatedPatchRequest).not.toHaveBeenCalled()
    }
  )

  test('shows an error linked to the textbox when the text is empty', async () => {
    const { document } = await submitCommercialForm({ reason: '' })

    expect(document.title).toMatch(/^Error:/)
    expectInputError({
      document,
      inputLabel: TEXTBOX_LABEL,
      errorMessage: REASON_REQUIRED
    })
    expect(authenticatedPatchRequest).not.toHaveBeenCalled()
  })

  test('shows an error linked to the textbox and keeps the text when it is 1001 characters', async () => {
    const reason = 'a'.repeat(1001)
    const { document } = await submitCommercialForm({ reason })

    expect(document.title).toMatch(/^Error:/)
    expectInputError({
      document,
      inputLabel: TEXTBOX_LABEL,
      errorMessage: REASON_TOO_LONG
    })
    expect(getByLabelText(document, TEXTBOX_LABEL)).toHaveValue(reason)
    expect(authenticatedPatchRequest).not.toHaveBeenCalled()
  })

  test.each([
    { name: '1000 characters', reason: 'a'.repeat(1000) },
    {
      name: '1000 characters including line breaks',
      reason: `${'a'.repeat(499)}\r\n${'a'.repeat(500)}`
    }
  ])(
    'saves $name, reloads the page and shows the saved text',
    async ({ reason }) => {
      const { response } = await submitCommercialForm({ reason })

      expect(response.statusCode).toBe(statusCodes.redirect)
      expect(response.headers.location).toBe(PAGE_URL)
      expect(authenticatedPatchRequest).toHaveBeenCalledWith(
        expect.any(Object),
        '/marine-licence/public-register-commercial-confidentiality',
        { ...choice, id: marineLicence.id, reason: reason.trim() }
      )

      const savedLicence = vi.mocked(setMarineLicenceCache).mock.calls.at(-1)[2]
      expect(savedLicence.publicRegister).toEqual({
        ...choice,
        reason: reason.trim()
      })

      mockMarineLicence(savedLicence)
      const document = await loadCommercialPage()

      expect(getByLabelText(document, TEXTBOX_LABEL)).toHaveValue(
        reason.trim().replaceAll('\r\n', '\n')
      )
    }
  )
})
