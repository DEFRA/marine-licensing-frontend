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

  test('lists policies as "title (code)" under alphabetical section headings, sorted by code', async () => {
    const document = await loadPolicyListPage()

    const sections = [...document.querySelectorAll('.govuk-task-list')].map(
      (taskList) => ({
        heading: taskList.previousElementSibling.textContent.trim(),
        policies: [
          ...taskList.querySelectorAll('.govuk-task-list__name-and-hint')
        ].map((el) => el.textContent.trim())
      })
    )

    expect(sections).toEqual([
      { heading: 'Economic', policies: ['South West Aggregates 2 (SW-AGG-2)'] },
      {
        heading: 'Environmental',
        policies: [
          'South West Biodiversity 1 (SW-BIO-1)',
          'South West Marine protected areas 1 (SW-MPA-1)'
        ]
      }
    ])
  })

  test('links each policy to its consideration page', async () => {
    const document = await loadPolicyListPage()

    expect(
      getByRole(document, 'link', {
        name: 'South West Aggregates 2 (SW-AGG-2)'
      })
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
