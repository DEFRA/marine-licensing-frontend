import { getByRole, getByText, within } from '@testing-library/dom'
import { marineLicenceRoutes } from '~/src/server/common/constants/routes.js'
import { statusCodes } from '~/src/server/common/constants/status-codes.js'
import {
  mockMarineLicence,
  setupTestServer
} from '~/tests/integration/shared/test-setup-helpers.js'
import { authenticatedPatchRequest } from '~/src/server/common/helpers/authenticated-requests.js'
import { loadPage, submitForm } from '~/tests/integration/shared/app-server.js'
import { expectFieldsetError } from '~/tests/integration/shared/expect-utils.js'
import {
  getFieldsetByLabel,
  getInputInFieldset
} from '~/tests/integration/shared/dom-helpers.js'

const QUESTION =
  'Do you want to ask us to withhold any information from the public register?'
const REASON_LEGEND = 'Select a reason'
const NATIONAL_SECURITY = 'National security reasons'
const COMMERCIAL_CONFIDENTIALITY =
  'Commercial or industrial confidentiality reasons'

describe('Public register', () => {
  const getServer = setupTestServer()
  const marineLicence = {
    id: 'marine-licence-123',
    projectName: 'Test Marine Project',
    publicRegister: undefined
  }

  const loadPublicRegisterPage = () =>
    loadPage({
      requestUrl: marineLicenceRoutes.MARINE_LICENCE_PUBLIC_REGISTER,
      server: getServer()
    })

  const submitPublicRegisterForm = (formData) =>
    submitForm({
      requestUrl: marineLicenceRoutes.MARINE_LICENCE_PUBLIC_REGISTER,
      server: getServer(),
      formData
    })

  const getQuestionInput = (document, inputLabel) =>
    getInputInFieldset({
      document,
      fieldsetLabel: QUESTION,
      inputLabel,
      findByHeading: true
    })

  const getReasonInput = (document, inputLabel) =>
    getInputInFieldset({
      document,
      fieldsetLabel: REASON_LEGEND,
      inputLabel
    })

  beforeEach(() => {
    mockMarineLicence(marineLicence)
  })

  test('page elements', async () => {
    const document = await loadPublicRegisterPage()

    expect(getByText(document, 'Test Marine Project')).toBeInTheDocument()
    expect(getByRole(document, 'link', { name: 'Back' })).toHaveAttribute(
      'href',
      marineLicenceRoutes.MARINE_LICENCE_TASK_LIST
    )
    expect(getByRole(document, 'heading', { level: 1 })).toHaveTextContent(
      'Withholding information from the public register'
    )
    expect(document.title).toContain(
      'Withholding information from the public register'
    )
    getByText(
      document,
      /We are required by law to publish information about your application on the MMO’s public register\./
    )
    getByText(document, 'We cannot withhold information for any other reason.')
    getByRole(document, 'button', { name: 'Continue' })
    expect(getByRole(document, 'link', { name: 'Cancel' })).toHaveAttribute(
      'href',
      marineLicenceRoutes.MARINE_LICENCE_TASK_LIST
    )
  })

  test('shows the personal information help in a details component', async () => {
    const document = await loadPublicRegisterPage()

    const details = document.querySelector('details.govuk-details')
    expect(
      within(details).getByText(
        'Help with personal information in your application'
      )
    ).toHaveClass('govuk-details__summary-text')
    within(details).getByText(
      /This includes the names and addresses of applicants, licence holders, agents and contractors\./
    )
    within(details).getByText(
      /This includes names, contact details and signatures\./
    )
    within(details).getByText(/This may delay your decision\./)
  })

  test('shows the national security warning', async () => {
    const document = await loadPublicRegisterPage()

    const warning = document.querySelector('.govuk-warning-text')
    expect(warning).toHaveTextContent(
      'You will need approval from the Secretary of State for Defence to withhold information on national security grounds.'
    )
  })

  test('shows Yes before No, with the reasons revealed by Yes', async () => {
    const document = await loadPublicRegisterPage()

    const questionFieldset = getByText(document, QUESTION, {
      selector: 'h2'
    }).closest('fieldset')
    const topLevelRadios = [
      ...questionFieldset.querySelectorAll(
        ':scope > .govuk-radios > .govuk-radios__item input'
      )
    ]
    expect(topLevelRadios.map((input) => input.value)).toEqual(['yes', 'no'])

    const yes = getQuestionInput(document, 'Yes')
    const conditional = document.getElementById(yes.dataset.ariaControls)
    expect(conditional).toHaveClass('govuk-radios__conditional')

    const reasonFieldset = getFieldsetByLabel({
      document,
      fieldsetLabel: REASON_LEGEND
    })
    expect(conditional).toContainElement(reasonFieldset)
    expect(getReasonInput(document, NATIONAL_SECURITY)).toHaveAttribute(
      'type',
      'radio'
    )
    expect(
      getReasonInput(document, COMMERCIAL_CONFIDENTIALITY)
    ).toHaveAttribute('type', 'radio')
    expect(within(reasonFieldset).queryByRole('textbox')).toBeNull()
  })

  test('form state when no decision set', async () => {
    const document = await loadPublicRegisterPage()

    expect(getQuestionInput(document, 'Yes')).not.toBeChecked()
    expect(getQuestionInput(document, 'No')).not.toBeChecked()
    expect(getReasonInput(document, NATIONAL_SECURITY)).not.toBeChecked()
    expect(
      getReasonInput(document, COMMERCIAL_CONFIDENTIALITY)
    ).not.toBeChecked()
  })

  test('form state when information is withheld with a reason', async () => {
    mockMarineLicence({
      ...marineLicence,
      publicRegister: {
        withholdConsent: 'yes',
        withholdReason: 'commercialConfidentiality'
      }
    })

    const document = await loadPublicRegisterPage()

    expect(getQuestionInput(document, 'Yes')).toBeChecked()
    expect(getReasonInput(document, NATIONAL_SECURITY)).not.toBeChecked()
    expect(getReasonInput(document, COMMERCIAL_CONFIDENTIALITY)).toBeChecked()
  })

  test('back link from Check Your Answers', async () => {
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

  test('shows a validation error when submitted without an answer', async () => {
    const { document } = await submitPublicRegisterForm({})

    expectFieldsetError({
      document,
      fieldsetLabel: QUESTION,
      errorMessage:
        'Select whether you want to request that information is withheld',
      findByHeading: true
    })
    expect(authenticatedPatchRequest).not.toHaveBeenCalled()
  })

  test('shows a validation error linked to the first reason when Yes is selected without a reason', async () => {
    const errorMessage = 'Select a reason why you want to withhold information'

    const { document } = await submitPublicRegisterForm({
      withholdConsent: 'yes'
    })

    expectFieldsetError({
      document,
      fieldsetLabel: REASON_LEGEND,
      errorMessage,
      useErrorClass: true
    })
    const summaryLink = within(getByRole(document, 'alert')).getByRole('link', {
      name: errorMessage
    })
    expect(summaryLink).toHaveAttribute('href', '#withholdReason')
    expect(document.getElementById('withholdReason')).toBe(
      getReasonInput(document, NATIONAL_SECURITY)
    )
    expect(getQuestionInput(document, 'Yes')).toBeChecked()
    expect(authenticatedPatchRequest).not.toHaveBeenCalled()
  })

  test('goes to the national security page when national security reasons are selected', async () => {
    const { response } = await submitPublicRegisterForm({
      withholdConsent: 'yes',
      withholdReason: 'nationalSecurity'
    })

    expect(response.statusCode).toBe(statusCodes.redirect)
    expect(response.headers.location).toBe(
      marineLicenceRoutes.MARINE_LICENCE_PUBLIC_REGISTER_NATIONAL_SECURITY
    )
    expect(authenticatedPatchRequest).toHaveBeenCalledWith(
      expect.any(Object),
      '/marine-licence/public-register',
      {
        id: marineLicence.id,
        withholdConsent: 'yes',
        withholdReason: 'nationalSecurity'
      }
    )
  })

  test('returns to the task list when commercial confidentiality reasons are selected', async () => {
    const { response } = await submitPublicRegisterForm({
      withholdConsent: 'yes',
      withholdReason: 'commercialConfidentiality'
    })

    expect(response.statusCode).toBe(statusCodes.redirect)
    expect(response.headers.location).toBe(
      marineLicenceRoutes.MARINE_LICENCE_TASK_LIST
    )
    expect(authenticatedPatchRequest).toHaveBeenCalledWith(
      expect.any(Object),
      '/marine-licence/public-register',
      {
        id: marineLicence.id,
        withholdConsent: 'yes',
        withholdReason: 'commercialConfidentiality'
      }
    )
  })

  test('keeps earlier selections when the user comes Back from the national security page', async () => {
    mockMarineLicence({
      ...marineLicence,
      publicRegister: {
        withholdConsent: 'yes',
        withholdReason: 'nationalSecurity',
        nationalSecurityApproval: 'yes',
        reason: 'Details of the berth'
      }
    })

    const document = await loadPublicRegisterPage()

    expect(getQuestionInput(document, 'Yes')).toBeChecked()
    expect(getReasonInput(document, NATIONAL_SECURITY)).toBeChecked()
  })

  test('returns to the task list without a reason when No is selected', async () => {
    const { response } = await submitPublicRegisterForm({
      withholdConsent: 'no',
      withholdReason: 'nationalSecurity'
    })

    expect(response.statusCode).toBe(statusCodes.redirect)
    expect(response.headers.location).toBe(
      marineLicenceRoutes.MARINE_LICENCE_TASK_LIST
    )
    expect(authenticatedPatchRequest).toHaveBeenCalledWith(
      expect.any(Object),
      '/marine-licence/public-register',
      { id: marineLicence.id, withholdConsent: 'no' }
    )
  })
})
