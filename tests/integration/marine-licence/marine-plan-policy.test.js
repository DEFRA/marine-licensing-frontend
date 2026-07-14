import { getByRole } from '@testing-library/dom'
import {
  mockMarineLicence,
  setupTestServer
} from '~/tests/integration/shared/test-setup-helpers.js'
import { loadPage } from '~/tests/integration/shared/app-server.js'
import { mockMarineLicenceWithMarinePlanPolicies } from '~/src/server/test-helpers/mocks/marine-licence-mocks.js'
import { getMarinePlanPolicyLink } from '~/src/server/common/helpers/marine-licence/marine-plan-policy-link.js'

describe('Marine plan policy (consideration) page', () => {
  const getServer = setupTestServer()

  const loadPolicyPage = () =>
    loadPage({
      requestUrl: getMarinePlanPolicyLink('SW-BIO-1'),
      server: getServer()
    })

  beforeEach(() => {
    mockMarineLicence({
      ...mockMarineLicenceWithMarinePlanPolicies,
      marinePlanPolicies: [
        {
          policyCode: 'SW-BIO-1',
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
      'SW-BIO-1'
    )
    expect(document.getElementById('policyConsideration')).not.toBeNull()
  })
})
