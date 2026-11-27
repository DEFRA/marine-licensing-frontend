import { vi } from 'vitest'
import { getByLabelText, getByRole, queryByRole } from '@testing-library/dom'
import { marineLicenceRoutes } from '~/src/server/common/constants/routes.js'
import { statusCodes } from '~/src/server/common/constants/status-codes.js'
import {
  mockMarineLicence,
  setupTestServer
} from '~/tests/integration/shared/test-setup-helpers.js'
import { authenticatedPatchRequest } from '~/src/server/common/helpers/authenticated-requests.js'
import { setMarineLicenceCache } from '~/src/server/common/helpers/marine-licence/session-cache/utils.js'
import { loadPage, submitForm } from '~/tests/integration/shared/app-server.js'
import { getInputInFieldset } from '~/tests/integration/shared/dom-helpers.js'

const {
  MARINE_LICENCE_PUBLIC_REGISTER: PUBLIC_REGISTER,
  MARINE_LICENCE_PUBLIC_REGISTER_NATIONAL_SECURITY: NATIONAL_SECURITY,
  MARINE_LICENCE_PUBLIC_REGISTER_COMMERCIAL_CONFIDENTIALITY: COMMERCIAL,
  MARINE_LICENCE_PUBLIC_REGISTER_CHECK_ANSWERS: CHECK_ANSWERS,
  MARINE_LICENCE_TASK_LIST: TASK_LIST
} = marineLicenceRoutes

const change = (path) => `${path}?action=change`

const APPROVAL_QUESTION =
  'Do you have approval from the Secretary of State for Defence to withhold information for national security reasons?'
const REASON_LABEL = 'Tell us what you want withheld and why'

const commercial = {
  withholdConsent: 'yes',
  withholdReason: 'commercialConfidentiality',
  reason: 'Pricing details'
}
const nationalSecurityApproved = {
  withholdConsent: 'yes',
  withholdReason: 'nationalSecurity',
  nationalSecurityApproval: 'yes',
  reason: 'Details of the berth'
}
const nationalSecurityNotApproved = {
  withholdConsent: 'yes',
  withholdReason: 'nationalSecurity',
  nationalSecurityApproval: 'no'
}

describe('Public register: change answers', () => {
  const getServer = setupTestServer()
  const marineLicence = {
    id: 'marine-licence-123',
    projectName: 'Test Marine Project'
  }

  const givenAnswers = (publicRegister) =>
    mockMarineLicence({ ...marineLicence, publicRegister })

  const load = (requestUrl) => loadPage({ requestUrl, server: getServer() })

  const submit = (requestUrl, formData) =>
    submitForm({ requestUrl, server: getServer(), formData })

  const getChangeLinks = (document) =>
    [...document.querySelectorAll('.govuk-summary-list__actions a')].map(
      (link) => ({
        href: link.getAttribute('href'),
        text: link.textContent.replaceAll(/\s+/g, ' ').trim()
      })
    )

  const expectChangeModeLinks = (document, backLink = CHECK_ANSWERS) => {
    expect(getByRole(document, 'link', { name: 'Back' })).toHaveAttribute(
      'href',
      backLink
    )
    expect(queryByRole(document, 'link', { name: 'Cancel' })).toBeNull()
  }

  const expectNothingSaved = () => {
    expect(authenticatedPatchRequest).not.toHaveBeenCalled()
    expect(setMarineLicenceCache).not.toHaveBeenCalled()
  }

  const expectRedirect = (response, location) => {
    expect(response.statusCode).toBe(statusCodes.redirect)
    expect(response.headers.location).toBe(location)
  }

  describe('review page Change links', () => {
    test.each([
      {
        name: 'commercial confidentiality',
        publicRegister: commercial,
        links: [
          {
            href: change(PUBLIC_REGISTER),
            text: 'Change whether you want to withhold information from the public register'
          },
          {
            href: change(COMMERCIAL),
            text: 'Change what you want withheld and why'
          }
        ]
      },
      {
        name: 'national security with approval',
        publicRegister: nationalSecurityApproved,
        links: [
          {
            href: change(PUBLIC_REGISTER),
            text: 'Change whether you want to withhold information from the public register'
          },
          {
            href: change(NATIONAL_SECURITY),
            text: 'Change whether you have approval from the Secretary of State for Defence'
          }
        ]
      }
    ])('$name', async ({ publicRegister, links }) => {
      givenAnswers(publicRegister)

      const document = await load(CHECK_ANSWERS)

      expect(getChangeLinks(document)).toEqual(links)
    })

    test('keep the check your answers query', async () => {
      givenAnswers(commercial)

      const document = await load(`${CHECK_ANSWERS}?from=check-your-answers`)

      expect(getChangeLinks(document)[0].href).toBe(
        `${PUBLIC_REGISTER}?action=change&from=check-your-answers`
      )
    })
  })

  describe('review page Back link from check your answers', () => {
    const FROM_CYA = 'from=check-your-answers'

    test('goes to check your answers before any change is saved', async () => {
      givenAnswers(commercial)

      const document = await load(`${CHECK_ANSWERS}?${FROM_CYA}`)

      expect(getByRole(document, 'link', { name: 'Back' })).toHaveAttribute(
        'href',
        `${marineLicenceRoutes.MARINE_LICENCE_CHECK_YOUR_ANSWERS}#public-register-card`
      )
    })

    test('saving a reason keeps change mode on the way back to the review page', async () => {
      givenAnswers(commercial)

      const { response } = await submit(`${change(COMMERCIAL)}&${FROM_CYA}`, {
        reason: 'Contract terms'
      })

      expectRedirect(response, `${change(CHECK_ANSWERS)}&${FROM_CYA}`)
    })

    test.each([
      { name: 'commercial', publicRegister: commercial, page: COMMERCIAL },
      {
        name: 'national security',
        publicRegister: nationalSecurityApproved,
        page: NATIONAL_SECURITY
      }
    ])(
      'goes to the $name page after a change is saved',
      async ({ publicRegister, page }) => {
        givenAnswers(publicRegister)

        const document = await load(`${change(CHECK_ANSWERS)}&${FROM_CYA}`)

        expect(getByRole(document, 'link', { name: 'Back' })).toHaveAttribute(
          'href',
          `${change(page)}&${FROM_CYA}`
        )
      }
    )
  })

  describe('withholding information page', () => {
    test('keeps the pending reason when the user comes Back from a switched reason page', async () => {
      givenAnswers(nationalSecurityApproved)

      const document = await load(
        `${change(PUBLIC_REGISTER)}&withholdReason=commercialConfidentiality`
      )

      expect(
        getByLabelText(
          document,
          'Commercial or industrial confidentiality reasons'
        )
      ).toBeChecked()
      expect(
        getByLabelText(document, 'National security reasons')
      ).not.toBeChecked()
      expectChangeModeLinks(document)
    })

    test('a validation error keeps change mode', async () => {
      givenAnswers(commercial)

      const { document } = await submit(change(PUBLIC_REGISTER), {})

      getByRole(document, 'heading', { name: 'There is a problem' })
      expectChangeModeLinks(document)
    })

    test('an unchanged answer returns to the review page without saving', async () => {
      givenAnswers(commercial)

      const { response } = await submit(change(PUBLIC_REGISTER), {
        withholdConsent: 'yes',
        withholdReason: 'commercialConfidentiality'
      })

      expectRedirect(response, CHECK_ANSWERS)
      expectNothingSaved()
    })

    test.each([
      {
        name: 'national security',
        publicRegister: commercial,
        withholdReason: 'nationalSecurity',
        location: change(NATIONAL_SECURITY)
      },
      {
        name: 'commercial confidentiality',
        publicRegister: nationalSecurityApproved,
        withholdReason: 'commercialConfidentiality',
        location: change(COMMERCIAL)
      }
    ])(
      'changing to $name goes to its page without saving',
      async ({ publicRegister, withholdReason, location }) => {
        givenAnswers(publicRegister)

        const { response } = await submit(change(PUBLIC_REGISTER), {
          withholdConsent: 'yes',
          withholdReason
        })

        expectRedirect(response, location)
        expectNothingSaved()
      }
    )

    test('changing to No saves and returns to the task list', async () => {
      givenAnswers(nationalSecurityApproved)

      const { response } = await submit(change(PUBLIC_REGISTER), {
        withholdConsent: 'no'
      })

      expectRedirect(response, TASK_LIST)
      expect(authenticatedPatchRequest).toHaveBeenCalledWith(
        expect.any(Object),
        '/marine-licence/public-register',
        { id: marineLicence.id, withholdConsent: 'no' }
      )
    })
  })

  describe('national security page', () => {
    const getApprovalInput = (document, inputLabel) =>
      getInputInFieldset({
        document,
        fieldsetLabel: APPROVAL_QUESTION,
        inputLabel,
        findByHeading: true
      })

    test('is pre-populated when changing the approval answer', async () => {
      givenAnswers(nationalSecurityApproved)

      const document = await load(change(NATIONAL_SECURITY))

      expect(getApprovalInput(document, 'Yes')).toBeChecked()
      expect(getByLabelText(document, REASON_LABEL)).toHaveValue(
        'Details of the berth'
      )
      expectChangeModeLinks(document)
    })

    test('is blank when switching from commercial confidentiality, with Back to the withholding page', async () => {
      givenAnswers(commercial)

      const document = await load(change(NATIONAL_SECURITY))

      expect(getApprovalInput(document, 'Yes')).not.toBeChecked()
      expect(getApprovalInput(document, 'No')).not.toBeChecked()
      expect(getByLabelText(document, REASON_LABEL)).toHaveValue('')
      expectChangeModeLinks(
        document,
        `${change(PUBLIC_REGISTER)}&withholdReason=nationalSecurity`
      )
    })

    test('switching from commercial saves only the national security answers', async () => {
      givenAnswers(commercial)

      const { response } = await submit(change(NATIONAL_SECURITY), {
        nationalSecurityApproval: 'no'
      })

      expectRedirect(response, change(CHECK_ANSWERS))
      expect(authenticatedPatchRequest).toHaveBeenCalledWith(
        expect.any(Object),
        '/marine-licence/public-register-national-security',
        { ...nationalSecurityNotApproved, id: marineLicence.id }
      )
      const savedLicence = vi.mocked(setMarineLicenceCache).mock.calls.at(-1)[2]
      expect(savedLicence.publicRegister).toEqual(nationalSecurityNotApproved)
    })

    test('changing from No to Yes still needs the reason, and keeps change mode', async () => {
      givenAnswers(nationalSecurityNotApproved)

      const { document } = await submit(change(NATIONAL_SECURITY), {
        nationalSecurityApproval: 'yes',
        reason: ''
      })

      getByRole(document, 'heading', { name: 'There is a problem' })
      expectChangeModeLinks(document)
      expect(authenticatedPatchRequest).not.toHaveBeenCalled()
    })

    test('redirects to the withholding information page when the answers are not complete', async () => {
      givenAnswers({ ...commercial, reason: undefined })

      const { response } = await submit(change(NATIONAL_SECURITY), {
        nationalSecurityApproval: 'no'
      })

      expectRedirect(response, PUBLIC_REGISTER)
      expect(authenticatedPatchRequest).not.toHaveBeenCalled()
    })
  })

  describe('commercial confidentiality page', () => {
    test('is pre-populated when changing the reason', async () => {
      givenAnswers(commercial)

      const document = await load(change(COMMERCIAL))

      expect(getByLabelText(document, REASON_LABEL)).toHaveValue(
        'Pricing details'
      )
      expectChangeModeLinks(document)
    })

    test('is blank when switching from national security, with Back to the withholding page', async () => {
      givenAnswers(nationalSecurityApproved)

      const document = await load(change(COMMERCIAL))

      expect(getByLabelText(document, REASON_LABEL)).toHaveValue('')
      expectChangeModeLinks(
        document,
        `${change(PUBLIC_REGISTER)}&withholdReason=commercialConfidentiality`
      )
    })

    test('switching from national security saves only the commercial answers', async () => {
      givenAnswers(nationalSecurityApproved)

      const { response } = await submit(change(COMMERCIAL), {
        reason: 'Contract terms'
      })

      expectRedirect(response, change(CHECK_ANSWERS))
      const publicRegister = {
        withholdConsent: 'yes',
        withholdReason: 'commercialConfidentiality',
        reason: 'Contract terms'
      }
      expect(authenticatedPatchRequest).toHaveBeenCalledWith(
        expect.any(Object),
        '/marine-licence/public-register-commercial-confidentiality',
        { ...publicRegister, id: marineLicence.id }
      )
      const savedLicence = vi.mocked(setMarineLicenceCache).mock.calls.at(-1)[2]
      expect(savedLicence.publicRegister).toEqual(publicRegister)
    })

    test('a validation error keeps change mode', async () => {
      givenAnswers(commercial)

      const { document } = await submit(change(COMMERCIAL), { reason: '' })

      getByRole(document, 'heading', { name: 'There is a problem' })
      expectChangeModeLinks(document)
    })
  })
})
