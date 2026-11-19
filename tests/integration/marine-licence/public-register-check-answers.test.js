import { getByRole, within } from '@testing-library/dom'
import { JSDOM } from 'jsdom'
import { marineLicenceRoutes } from '~/src/server/common/constants/routes.js'
import { statusCodes } from '~/src/server/common/constants/status-codes.js'
import {
  mockMarineLicence,
  setupTestServer
} from '~/tests/integration/shared/test-setup-helpers.js'
import { authenticatedPatchRequest } from '~/src/server/common/helpers/authenticated-requests.js'
import { loadPage, submitForm } from '~/tests/integration/shared/app-server.js'
import { makeGetRequest } from '~/src/server/test-helpers/server-requests.js'

const PAGE_URL =
  marineLicenceRoutes.MARINE_LICENCE_PUBLIC_REGISTER_CHECK_ANSWERS
const HEADING =
  'Check your answers for information published on the public register'
const WITHHOLD_QUESTION =
  'Do you want to ask us to withhold any information from the public register?'
const APPROVAL_QUESTION =
  'Do you have approval from the Secretary of State for Defence to withhold information for national security reasons?'

const nationalSecurity = {
  withholdConsent: 'yes',
  withholdReason: 'nationalSecurity'
}
const commercial = {
  withholdConsent: 'yes',
  withholdReason: 'commercialConfidentiality'
}

const getRows = (document) =>
  [...document.querySelectorAll('.govuk-summary-list__row')].map((row) => ({
    key: row.querySelector('.govuk-summary-list__key').textContent.trim(),
    value: row.querySelector('.govuk-summary-list__value').textContent.trim()
  }))

describe('Public register: check answers', () => {
  const getServer = setupTestServer()
  const marineLicence = {
    id: 'marine-licence-123',
    projectName: 'Test Marine Project'
  }

  const loadCheckAnswersPage = (publicRegister) => {
    mockMarineLicence({ ...marineLicence, publicRegister })
    return loadPage({ requestUrl: PAGE_URL, server: getServer() })
  }

  test('page content', async () => {
    const document = await loadCheckAnswersPage({
      ...commercial,
      reason: 'Pricing details'
    })

    expect(document.title).toContain(HEADING)
    expect(getByRole(document, 'heading', { level: 1 })).toHaveTextContent(
      HEADING
    )
    within(document.querySelector('.govuk-caption-l')).getByText(
      'Test Marine Project'
    )
    getByRole(document, 'button', { name: 'Continue' })
    expect(document.querySelector('.govuk-summary-list__actions')).toBeNull()
  })

  test.each([
    {
      name: 'commercial confidentiality',
      publicRegister: { ...commercial, reason: 'Pricing details' },
      rows: [
        {
          key: WITHHOLD_QUESTION,
          value: 'Yes – Commercial or industrial confidentiality reasons'
        },
        { key: 'What you want withheld and why', value: 'Pricing details' }
      ],
      backLink:
        marineLicenceRoutes.MARINE_LICENCE_PUBLIC_REGISTER_COMMERCIAL_CONFIDENTIALITY
    },
    {
      name: 'national security with approval',
      publicRegister: {
        ...nationalSecurity,
        nationalSecurityApproval: 'yes',
        reason: 'Details of the berth'
      },
      rows: [
        { key: WITHHOLD_QUESTION, value: 'Yes – National security reasons' },
        { key: APPROVAL_QUESTION, value: 'Yes' },
        { key: 'What you want withheld', value: 'Details of the berth' }
      ],
      backLink:
        marineLicenceRoutes.MARINE_LICENCE_PUBLIC_REGISTER_NATIONAL_SECURITY
    },
    {
      name: 'national security without approval',
      publicRegister: { ...nationalSecurity, nationalSecurityApproval: 'no' },
      rows: [
        { key: WITHHOLD_QUESTION, value: 'Yes – National security reasons' },
        {
          key: APPROVAL_QUESTION,
          value:
            'No – If you get approval later, you can come back and change your answer before you submit your application.'
        }
      ],
      backLink:
        marineLicenceRoutes.MARINE_LICENCE_PUBLIC_REGISTER_NATIONAL_SECURITY
    }
  ])(
    'shows the answers and back link for $name',
    async ({ publicRegister, rows, backLink }) => {
      const document = await loadCheckAnswersPage(publicRegister)

      expect(getRows(document)).toEqual(rows)
      expect(getByRole(document, 'link', { name: 'Back' })).toHaveAttribute(
        'href',
        backLink
      )
    }
  )

  test('back link points to the task list when arriving from the task list', async () => {
    mockMarineLicence({
      ...marineLicence,
      publicRegister: { ...nationalSecurity, nationalSecurityApproval: 'no' }
    })

    const response = await makeGetRequest({
      url: PAGE_URL,
      server: getServer(),
      headers: {
        referer: `http://localhost${marineLicenceRoutes.MARINE_LICENCE_TASK_LIST}`
      }
    })
    const { document } = new JSDOM(response.result).window

    expect(getByRole(document, 'link', { name: 'Back' })).toHaveAttribute(
      'href',
      marineLicenceRoutes.MARINE_LICENCE_TASK_LIST
    )
  })

  test('escapes the withheld information and keeps its line breaks', async () => {
    const document = await loadCheckAnswersPage({
      ...commercial,
      reason: '<script>alert(1)</script>\nSecond line'
    })

    const value = document.querySelectorAll('.govuk-summary-list__value')[1]
    expect(value.querySelector('script')).toBeNull()
    expect(value.querySelector('br')).not.toBeNull()
    expect(value.textContent).toContain('<script>alert(1)</script>')
    expect(value.textContent).toContain('Second line')
  })

  test('redirects without confirming when the reason page is not done', async () => {
    mockMarineLicence({ ...marineLicence, publicRegister: nationalSecurity })

    const getResponse = await makeGetRequest({
      url: PAGE_URL,
      server: getServer()
    })
    const { response: postResponse } = await submitForm({
      requestUrl: PAGE_URL,
      server: getServer(),
      formData: {}
    })

    for (const response of [getResponse, postResponse]) {
      expect(response.statusCode).toBe(statusCodes.redirect)
      expect(response.headers.location).toBe(
        marineLicenceRoutes.MARINE_LICENCE_PUBLIC_REGISTER_NATIONAL_SECURITY
      )
    }
    expect(authenticatedPatchRequest).not.toHaveBeenCalled()
  })

  test('Continue confirms the answers and returns to the task list', async () => {
    mockMarineLicence({
      ...marineLicence,
      publicRegister: { ...nationalSecurity, nationalSecurityApproval: 'no' }
    })

    const { response } = await submitForm({
      requestUrl: PAGE_URL,
      server: getServer(),
      formData: {}
    })

    expect(response.statusCode).toBe(statusCodes.redirect)
    expect(response.headers.location).toBe(
      marineLicenceRoutes.MARINE_LICENCE_TASK_LIST
    )
    expect(authenticatedPatchRequest).toHaveBeenCalledWith(
      expect.any(Object),
      '/marine-licence/confirm-public-register',
      { id: marineLicence.id }
    )
  })
})
