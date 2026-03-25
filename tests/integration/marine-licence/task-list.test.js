import { getByRole, getByText } from '@testing-library/dom'
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

  test('should render review button when all tasks are completed', async () => {
    mockMarineLicence({
      ...mockMarineLicenceApplication,
      taskList: [{ status: { text: 'Completed' } }]
    })

    expect(getByRole(document, 'heading', { level: 1 })).toHaveTextContent(
      'Marine licence start page'
    )

    expect(
      getByRole(document, 'button', {
        name: 'Review and send your information'
      })
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
