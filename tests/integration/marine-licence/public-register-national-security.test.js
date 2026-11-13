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
import {
  expectFieldsetError,
  expectInputError
} from '~/tests/integration/shared/expect-utils.js'
import { getInputInFieldset } from '~/tests/integration/shared/dom-helpers.js'

const PAGE_URL =
  marineLicenceRoutes.MARINE_LICENCE_PUBLIC_REGISTER_NATIONAL_SECURITY
const HEADING = 'Withholding information for national security reasons'
const QUESTION =
  'Do you have approval from the Secretary of State for Defence to withhold information for national security reasons?'
const TEXTBOX_LABEL = 'Tell us what you want withheld and why'
const APPROVAL_REQUIRED =
  'Select whether you have approval from the Secretary of State for Defence to withhold information for national security reasons'
const REASON_REQUIRED = 'Enter details of what you want withheld'
const REASON_TOO_LONG =
  'Details of what you want withheld must be 1000 characters or fewer'

describe('Public register: national security', () => {
  const getServer = setupTestServer()
  const marineLicence = {
    id: 'marine-licence-123',
    projectName: 'Test Marine Project',
    publicRegister: {
      withholdConsent: 'yes',
      withholdReason: 'nationalSecurity'
    }
  }

  const loadNationalSecurityPage = (requestUrl = PAGE_URL) =>
    loadPage({ requestUrl, server: getServer() })

  const submitNationalSecurityForm = (formData) =>
    submitForm({ requestUrl: PAGE_URL, server: getServer(), formData })

  const getQuestionInput = (document, inputLabel) =>
    getInputInFieldset({
      document,
      fieldsetLabel: QUESTION,
      inputLabel,
      findByHeading: true
    })

  beforeEach(() => {
    mockMarineLicence(marineLicence)
  })

  test('page content', async () => {
    const document = await loadNationalSecurityPage()

    expect(document.title).toContain(HEADING)
    expect(getByRole(document, 'heading', { level: 1 })).toHaveTextContent(
      HEADING
    )
    within(document.querySelector('.govuk-caption-l')).getByText(
      'Test Marine Project'
    )
    within(document.body).getByText(
      /This covers the security and wellbeing of the UK, its people, its institutions and its system of government\./
    )
    within(document.body).getByText(
      'locations, assets, systems or capabilities that may be vulnerable to hostile acts'
    )
    expect(document.querySelector('.govuk-warning-text')).toHaveTextContent(
      'You will need approval from the Secretary of State for Defence to withhold information on national security grounds.'
    )
    within(document.body).getByText(
      /If we decide it does not, we will publish the information\./
    )
    expect(
      getByRole(document, 'heading', { level: 2, name: QUESTION })
    ).toBeInTheDocument()
    getByRole(document, 'button', { name: 'Continue' })
  })

  test('Yes reveals the textbox and No has a hint', async () => {
    const document = await loadNationalSecurityPage()

    const yes = getQuestionInput(document, 'Yes')
    const no = getQuestionInput(document, 'No')
    const conditional = document.getElementById(yes.dataset.ariaControls)
    expect(conditional).toHaveClass('govuk-radios__conditional')

    const textbox = getByLabelText(document, TEXTBOX_LABEL)
    expect(textbox.tagName).toBe('TEXTAREA')
    expect(conditional).toContainElement(textbox)
    expect(textbox).toHaveAccessibleDescription(
      expect.stringContaining(
        'details of your approval from the Secretary of State for Defence'
      )
    )
    expect(textbox).toHaveAccessibleDescription(
      expect.stringContaining('Enter a maximum of 1,000 characters')
    )
    expect(no).toHaveAccessibleDescription(
      'If you get approval later, you can come back and change your answer before you submit your application.'
    )
    expect(yes).not.toBeChecked()
    expect(no).not.toBeChecked()
  })

  test('Back returns to the withholding information page and Cancel to the task list', async () => {
    const document = await loadNationalSecurityPage()

    expect(getByRole(document, 'link', { name: 'Back' })).toHaveAttribute(
      'href',
      marineLicenceRoutes.MARINE_LICENCE_PUBLIC_REGISTER
    )
    expect(getByRole(document, 'link', { name: 'Cancel' })).toHaveAttribute(
      'href',
      marineLicenceRoutes.MARINE_LICENCE_TASK_LIST
    )
  })

  test('Back and Cancel stay within check your answers', async () => {
    const document = await loadNationalSecurityPage(
      `${PAGE_URL}?from=check-your-answers`
    )

    expect(getByRole(document, 'link', { name: 'Back' })).toHaveAttribute(
      'href',
      `${marineLicenceRoutes.MARINE_LICENCE_PUBLIC_REGISTER}?from=check-your-answers`
    )
    expect(getByRole(document, 'link', { name: 'Cancel' })).toHaveAttribute(
      'href',
      marineLicenceRoutes.MARINE_LICENCE_CHECK_YOUR_ANSWERS
    )
  })

  test.each([
    { withholdConsent: 'yes', withholdReason: 'commercialConfidentiality' },
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
      const { response: postResponse } = await submitNationalSecurityForm({
        nationalSecurityApproval: 'no'
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

  test('shows an error when neither option is selected', async () => {
    const { document } = await submitNationalSecurityForm({})

    expectFieldsetError({
      document,
      fieldsetLabel: QUESTION,
      errorMessage: APPROVAL_REQUIRED,
      findByHeading: true
    })
    expect(authenticatedPatchRequest).not.toHaveBeenCalled()
  })

  test('shows an error linked to the textbox when Yes is selected and the text is empty', async () => {
    const { document } = await submitNationalSecurityForm({
      nationalSecurityApproval: 'yes',
      reason: ''
    })

    expectInputError({
      document,
      inputLabel: TEXTBOX_LABEL,
      errorMessage: REASON_REQUIRED
    })
    expect(getQuestionInput(document, 'Yes')).toBeChecked()
    expect(authenticatedPatchRequest).not.toHaveBeenCalled()
  })

  test('shows an error linked to the textbox when the text is 1001 characters', async () => {
    const reason = 'a'.repeat(1001)
    const { document } = await submitNationalSecurityForm({
      nationalSecurityApproval: 'yes',
      reason
    })

    expectInputError({
      document,
      inputLabel: TEXTBOX_LABEL,
      errorMessage: REASON_TOO_LONG
    })
    expect(getByLabelText(document, TEXTBOX_LABEL)).toHaveValue(reason)
    expect(authenticatedPatchRequest).not.toHaveBeenCalled()
  })

  test('saves 1000 characters, reloads the page and shows the saved values', async () => {
    const reason = 'a'.repeat(1000)
    const { response } = await submitNationalSecurityForm({
      nationalSecurityApproval: 'yes',
      reason
    })

    expect(response.statusCode).toBe(statusCodes.redirect)
    expect(response.headers.location).toBe(PAGE_URL)
    expect(authenticatedPatchRequest).toHaveBeenCalledWith(
      expect.any(Object),
      '/marine-licence/public-register-national-security',
      { id: marineLicence.id, nationalSecurityApproval: 'yes', reason }
    )

    const savedLicence = vi.mocked(setMarineLicenceCache).mock.calls.at(-1)[2]
    expect(savedLicence.publicRegister).toEqual({
      withholdConsent: 'yes',
      withholdReason: 'nationalSecurity',
      nationalSecurityApproval: 'yes',
      reason
    })

    mockMarineLicence(savedLicence)
    const document = await loadNationalSecurityPage()

    expect(getQuestionInput(document, 'Yes')).toBeChecked()
    expect(getByLabelText(document, TEXTBOX_LABEL)).toHaveValue(reason)
  })

  test('No saves without the text', async () => {
    mockMarineLicence({
      ...marineLicence,
      publicRegister: {
        ...marineLicence.publicRegister,
        nationalSecurityApproval: 'yes',
        reason: 'Details of the berth'
      }
    })

    const { response } = await submitNationalSecurityForm({
      nationalSecurityApproval: 'no',
      reason: 'Details of the berth'
    })

    expect(response.statusCode).toBe(statusCodes.redirect)
    expect(response.headers.location).toBe(PAGE_URL)
    expect(authenticatedPatchRequest).toHaveBeenCalledWith(
      expect.any(Object),
      '/marine-licence/public-register-national-security',
      { id: marineLicence.id, nationalSecurityApproval: 'no' }
    )
    const savedLicence = vi.mocked(setMarineLicenceCache).mock.calls.at(-1)[2]
    expect(savedLicence.publicRegister).toEqual({
      withholdConsent: 'yes',
      withholdReason: 'nationalSecurity',
      nationalSecurityApproval: 'no'
    })
  })
})
