import { getByRole } from '@testing-library/dom'
import { marineLicenceRoutes } from '~/src/server/common/constants/routes.js'
import {
  mockMarineLicence,
  setupTestServer
} from '~/tests/integration/shared/test-setup-helpers.js'
import { loadPage } from '~/tests/integration/shared/app-server.js'
import { mockMarineLicenceWithMarinePlanPolicies } from '~/src/server/test-helpers/mocks/marine-licence-mocks.js'
import { getMarinePlanPolicyLink } from '~/src/server/common/helpers/marine-licence/marine-plan-policy-link.js'

describe('Marine plan policies (policy list) page', () => {
  const getServer = setupTestServer()

  const loadPolicyListPage = () =>
    loadPage({
      requestUrl: marineLicenceRoutes.MARINE_LICENCE_MARINE_PLAN_POLICIES,
      server: getServer()
    })

  beforeEach(() => {
    mockMarineLicence(mockMarineLicenceWithMarinePlanPolicies)
  })

  test('renders the heading and the policy count', async () => {
    const document = await loadPolicyListPage()

    expect(getByRole(document, 'heading', { level: 1 })).toHaveTextContent(
      'Marine plan policies'
    )
    expect(document.body).toHaveTextContent('3 policies to complete')
  })

  test('uses singular wording when there is exactly one policy', async () => {
    mockMarineLicence({
      ...mockMarineLicenceWithMarinePlanPolicies,
      marinePlanPoliciesCount: 1,
      marinePlanPolicies: [{ policyCode: 'SW-AGG-2' }]
    })

    const document = await loadPolicyListPage()

    expect(document.body).toHaveTextContent('1 policy to complete')
  })

  test('lists policy codes sorted alphabetically', async () => {
    const document = await loadPolicyListPage()

    const codes = [
      ...document.querySelectorAll('.govuk-task-list__name-and-hint')
    ].map((el) => el.textContent.trim())

    expect(codes).toEqual(['SW-AGG-2', 'SW-BIO-1', 'SW-MPA-1'])
  })

  test('renders each policy code as a link to its consideration page', async () => {
    const document = await loadPolicyListPage()

    expect(
      getByRole(document, 'link', { name: 'SW-AGG-2' })
    ).toHaveAttribute('href', getMarinePlanPolicyLink('SW-AGG-2'))
    expect(document.querySelectorAll('.govuk-task-list__link')).toHaveLength(3)
  })

  test('Continue button and back link both return to the task list', async () => {
    const document = await loadPolicyListPage()

    expect(getByRole(document, 'button', { name: 'Continue' })).toHaveAttribute(
      'href',
      marineLicenceRoutes.MARINE_LICENCE_TASK_LIST
    )
    expect(
      getByRole(document, 'link', { name: 'Back to your project task list' })
    ).toHaveAttribute('href', marineLicenceRoutes.MARINE_LICENCE_TASK_LIST)
  })
})
