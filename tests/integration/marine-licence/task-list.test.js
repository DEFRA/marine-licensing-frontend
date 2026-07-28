import { getByRole, getByText, queryByRole } from '@testing-library/dom'
import { marineLicenceRoutes } from '~/src/server/common/constants/routes.js'
import {
  mockMarineLicence,
  setupTestServer
} from '~/tests/integration/shared/test-setup-helpers.js'
import { loadPage } from '~/tests/integration/shared/app-server.js'
import { mockMarineLicenceApplication } from '~/src/server/test-helpers/mocks/marine-licence-mocks.js'
import { employeeSession } from '~/tests/integration/shared/session-fixtures.js'
import { getUserSession } from '~/src/server/common/plugins/auth/utils.js'
vi.mock('~/src/server/common/plugins/auth/utils.js')

describe('Task List', () => {
  const getServer = setupTestServer()
  let document

  beforeAll(() => {
    vi.mocked(getUserSession).mockResolvedValue(employeeSession)
  })

  beforeEach(async () => {
    mockMarineLicence(mockMarineLicenceApplication)
    document = await loadPage({
      requestUrl: marineLicenceRoutes.MARINE_LICENCE_TASK_LIST,
      server: getServer()
    })
  })

  test('should render task list page elements', () => {
    expect(getByRole(document, 'heading', { level: 1 })).toHaveTextContent(
      'Marine licence start page'
    )

    expect(
      getByText(
        document,
        'You need to complete all sections before sending your application. Your progress will be saved as you go if you need to come back later.'
      )
    ).toBeInTheDocument()

    expect(
      getByRole(document, 'heading', { level: 2, name: 'Project details' })
    ).toBeInTheDocument()

    expect(
      getByRole(document, 'heading', {
        level: 2,
        name: 'Site details and activities'
      })
    ).toBeInTheDocument()
  })

  test('should render site details link in Site Details task list', () => {
    expect(
      getByRole(document, 'link', { name: 'Site details' })
    ).toBeInTheDocument()
  })

  test('should render water framework directive link in Water Framework Directive  task list', () => {
    expect(
      getByRole(document, 'link', {
        name: 'Water Framework Directive assessment'
      })
    ).toBeInTheDocument()
  })

  test('should render review button when all tasks are completed', async () => {
    mockMarineLicence({
      ...mockMarineLicenceApplication,
      marinePlanPolicyJob: 'ready',
      marinePlanPoliciesCount: 3,
      marinePlanPolicyResponseCount: 3
    })
    const completedDocument = await loadPage({
      requestUrl: marineLicenceRoutes.MARINE_LICENCE_TASK_LIST,
      server: getServer()
    })

    expect(
      getByRole(completedDocument, 'heading', { level: 1 })
    ).toHaveTextContent('Marine licence start page')

    expect(
      getByRole(completedDocument, 'button', {
        name: 'Review and send your information'
      })
    ).toBeInTheDocument()
  })

  test('should not render review button when marine plan policies are incomplete', async () => {
    mockMarineLicence({
      ...mockMarineLicenceApplication,
      marinePlanPolicyJob: 'ready',
      marinePlanPoliciesCount: 3,
      marinePlanPolicyResponseCount: 1
    })
    const incompleteDocument = await loadPage({
      requestUrl: marineLicenceRoutes.MARINE_LICENCE_TASK_LIST,
      server: getServer()
    })

    expect(
      queryByRole(incompleteDocument, 'button', {
        name: 'Review and send your information'
      })
    ).not.toBeInTheDocument()
  })

  test('should link "Marine plan policy considerations" to the holding page when marinePlanPolicyJob is pending', async () => {
    mockMarineLicence({
      ...mockMarineLicenceApplication,
      marinePlanPolicyJob: 'pending'
    })
    const pendingDocument = await loadPage({
      requestUrl: marineLicenceRoutes.MARINE_LICENCE_TASK_LIST,
      server: getServer()
    })

    expect(
      getByRole(pendingDocument, 'link', {
        name: 'Marine plan policy considerations'
      })
    ).toHaveAttribute(
      'href',
      marineLicenceRoutes.MARINE_LICENCE_MARINE_PLAN_POLICIES_HOLDING
    )
  })

  test('should link "Marine plan policy considerations" to the spinner page (re-trigger) when marinePlanPolicyJob is failed and site details are completed', async () => {
    mockMarineLicence({
      ...mockMarineLicenceApplication,
      marinePlanPolicyJob: 'failed'
    })
    const failedDocument = await loadPage({
      requestUrl: marineLicenceRoutes.MARINE_LICENCE_TASK_LIST,
      server: getServer()
    })

    expect(
      getByRole(failedDocument, 'link', {
        name: 'Marine plan policy considerations'
      })
    ).toHaveAttribute(
      'href',
      marineLicenceRoutes.MARINE_LICENCE_CALCULATE_MARINE_PLAN_POLICIES
    )
  })

  test('should render "Marine plan policy considerations" as unlinked "Cannot start yet" when marinePlanPolicyJob is failed but site details are not completed', async () => {
    mockMarineLicence({
      ...mockMarineLicenceApplication,
      marinePlanPolicyJob: 'failed',
      taskList: {
        ...mockMarineLicenceApplication.taskList,
        siteDetails: 'IN_PROGRESS'
      }
    })
    const failedDocument = await loadPage({
      requestUrl: marineLicenceRoutes.MARINE_LICENCE_TASK_LIST,
      server: getServer()
    })

    expect(
      queryByRole(failedDocument, 'link', {
        name: 'Marine plan policy considerations'
      })
    ).not.toBeInTheDocument()
    expect(
      getByText(failedDocument, 'Marine plan policy considerations')
    ).toBeInTheDocument()
  })

  test('should display phase banner with feedback link that goes to current URL', () => {
    const phaseBanner = document.querySelector('.govuk-phase-banner')
    expect(phaseBanner).toBeInTheDocument()

    const betaTag = getByText(phaseBanner, 'Beta')
    expect(betaTag).toBeInTheDocument()

    const feedbackLink = getByRole(phaseBanner, 'link', {
      name: /give your feedback/i
    })
    expect(feedbackLink).toBeInTheDocument()
    expect(feedbackLink).toHaveAttribute('target', '_blank')
    expect(feedbackLink).toHaveAttribute('rel', 'noopener noreferrer')
    expect(feedbackLink).toHaveAttribute(
      'href',
      'https://forms.office.com/pages/responsepage.aspx?id=UCQKdycCYkyQx044U38RAjXEiYXnHG1DvkWr_VjRfzZUNERIRURNOFNVT0tXSlo1NUdONUYxQjNKUy4u&route=shorturl'
    )
  })
})
