import { getByRole } from '@testing-library/dom'
import {
  mockMarineLicence,
  setupTestServer
} from '~/tests/integration/shared/test-setup-helpers.js'
import { loadPage, submitForm } from '~/tests/integration/shared/app-server.js'
import { validateErrors } from '~/tests/integration/shared/expect-utils.js'
import { errorMessages } from '~/src/server/marine-licence/marine-plan-policies/marine-plan-policy/controller.js'
import { mockMarineLicenceWithMarinePlanPolicies } from '~/src/server/test-helpers/mocks/marine-licence-mocks.js'
import { getMarinePlanPolicyLink } from '~/src/server/common/helpers/marine-licence/marine-plan-policy-link.js'

describe('Marine plan policy (consideration) page', () => {
  const getServer = setupTestServer()

  const loadPolicyPage = () =>
    loadPage({
      requestUrl: getMarinePlanPolicyLink('SW-BIO-1'),
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
      ]
    })
  })

  test('renders the policy wording as formatted markup', async () => {
    const document = await loadPolicyPage()

    expect(document.querySelectorAll('.app-policy-wording ol li')).toHaveLength(
      2
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
    expect(document.getElementById('policyConsideration')).not.toBeNull()
  })

  test('shows a min length error when the consideration response is under 70 characters', async () => {
    const document = await submitPolicyForm({
      policyConsideration: 'a'.repeat(69)
    })

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
