import { getByRole } from '@testing-library/dom'
import {
  mockMarineLicence,
  setupTestServer
} from '~/tests/integration/shared/test-setup-helpers.js'
import { loadPage, submitForm } from '~/tests/integration/shared/app-server.js'
import { validateErrors } from '~/tests/integration/shared/expect-utils.js'
import { errorMessages } from '~/src/server/marine-licence/marine-plan-policies/marine-plan-policy/controller.js'
import {
  mockLinkedMarinePlanPolicyDocument,
  mockMarineLicenceApplication,
  mockMarineLicenceWithMarinePlanPolicies
} from '~/src/server/test-helpers/mocks/marine-licence-mocks.js'
import { getMarinePlanPolicyLink } from '~/src/server/common/helpers/marine-licence/marine-plan-policy-link.js'
import { makeGetRequest } from '~/src/server/test-helpers/server-requests.js'
import { statusCodes } from '~/src/server/common/constants/status-codes.js'
import { marineLicenceRoutes } from '~/src/server/common/constants/routes.js'

describe('Marine plan policy (consideration) page', () => {
  const getServer = setupTestServer()

  const loadPolicyPage = (policy = 'SW-BIO-1') =>
    loadPage({
      requestUrl: getMarinePlanPolicyLink(policy),
      server: getServer()
    })

  const submitPolicyForm = async (formData) => {
    const { document } = await submitForm({
      requestUrl: getMarinePlanPolicyLink('SW-BIO-1'),
      server: getServer(),
      formData
    })
    return document
  }

  beforeEach(() => {
    mockMarineLicence({
      ...mockMarineLicenceWithMarinePlanPolicies,
      marinePlanPolicies: [
        {
          policyCode: 'SW-BIO-1',
          title: 'South West Biodiversity 1',
          category: 'Environmental',
          policy: '<p>Intro</p><ol><li>first</li><li>second</li></ol>'
        }
      ],
      marinePlanPolicyResponses: {
        'SW-BIO-1': { response: 'My answer', requiresDocumentation: true }
      }
    })
  })

  test('renders the policy page content as formatted markup', async () => {
    const document = await loadPolicyPage()

    expect(document.querySelectorAll('.app-policy-wording ol li')).toHaveLength(
      2
    )

    expect(document.querySelector('.govuk-inset-text')).not.toBeInTheDocument()
  })

  test('renders the policy associated documents list if it exists', async () => {
    mockMarineLicence({
      ...mockMarineLicenceApplication,
      marinePlanPolicies: [
        {
          policyCode: 'S-CC-1',
          title: 'SCC1 Title',
          category: 'Environmental',
          policy: '<p>Intro</p><ol><li>first</li><li>second</li></ol>'
        }
      ],
      marinePlanPolicySupportingDocuments: {
        ...mockMarineLicenceApplication.marinePlanPolicySupportingDocuments,
        linkedDocuments: [mockLinkedMarinePlanPolicyDocument]
      }
    })

    const document = await loadPolicyPage('S-CC-1')

    expect(document.querySelector('.govuk-inset-text')).toHaveTextContent(
      'Documents linked to this policy'
    )

    expect(document.querySelector('.govuk-inset-text')).toHaveTextContent(
      `${mockLinkedMarinePlanPolicyDocument.uploadedFile.filename} - ${mockLinkedMarinePlanPolicyDocument.policyLinks[0].location}`
    )
  })

  test('does not render the wording as escaped, visible markup', async () => {
    const document = await loadPolicyPage()

    expect(document.body.textContent).not.toContain('<ol>')
  })

  test('renders the heading and the policy consideration textarea', async () => {
    const document = await loadPolicyPage()

    expect(getByRole(document, 'heading', { level: 1 })).toHaveTextContent(
      'South West Biodiversity 1 (SW-BIO-1)'
    )
    expect(document.getElementById('policyConsideration')).toHaveValue(
      'My answer'
    )
    expect(
      getByRole(document, 'link', {
        name: 'Find out more detailed information about this policy (opens in a new tab)'
      })
    ).toHaveAttribute(
      'href',
      'https://environment.data.gov.uk/marine-plans-explorer/policy/SW-BIO-1'
    )
    expect(
      getByRole(document, 'link', {
        name: 'Get help with completing the Marine plan policies section (opens in a new tab)'
      })
    ).toHaveAttribute(
      'href',
      marineLicenceRoutes.MARINE_LICENCE_MARINE_PLAN_POLICY_GUIDANCE
    )
    expect(
      document.querySelector('input[name="documentationCheck"]')
    ).toBeChecked()
  })

  test.each([
    ['the policy code is not in the licence', 'UNKNOWN-1', undefined],
    ['the licence id is missing from the cache', 'SW-BIO-1', {}],
    [
      'the licence has no marine plan policies',
      'SW-BIO-1',
      { id: mockMarineLicenceWithMarinePlanPolicies.id }
    ]
  ])('returns 404 when %s', async (_, policyCode, cachedLicence) => {
    if (cachedLicence) {
      mockMarineLicence(cachedLicence)
    }

    const response = await makeGetRequest({
      url: getMarinePlanPolicyLink(policyCode),
      server: getServer()
    })

    expect(response.statusCode).toBe(statusCodes.notFound)
  })

  test('shows a required error when the consideration response is empty', async () => {
    const document = await submitPolicyForm({ policyConsideration: '' })

    validateErrors(
      [
        {
          field: 'policyConsideration',
          message: errorMessages.POLICY_CONSIDERATION_REQUIRED
        }
      ],
      document
    )
  })

  test('shows a min length error when the consideration response is under 70 characters', async () => {
    const document = await submitPolicyForm({
      policyConsideration: 'a'.repeat(69)
    })

    expect(document.getElementById('policyConsideration')).toHaveValue(
      'a'.repeat(69)
    )

    validateErrors(
      [
        {
          field: 'policyConsideration',
          message: errorMessages.POLICY_CONSIDERATION_MIN_LENGTH
        }
      ],
      document
    )
  })

  test('shows the documentation min length error when the checkbox is checked', async () => {
    const document = await submitPolicyForm({
      policyConsideration: 'a'.repeat(69),
      documentationCheck: 'requiresDocumentation'
    })

    validateErrors(
      [
        {
          field: 'policyConsideration',
          message:
            errorMessages.POLICY_CONSIDERATION_MIN_LENGTH_WITH_DOCUMENTATION
        }
      ],
      document
    )
  })

  test('shows a max length error when the consideration response exceeds 2000 characters', async () => {
    const document = await submitPolicyForm({
      policyConsideration: 'a'.repeat(2001)
    })

    validateErrors(
      [
        {
          field: 'policyConsideration',
          message: errorMessages.POLICY_CONSIDERATION_MAX_LENGTH
        }
      ],
      document
    )
  })
})
