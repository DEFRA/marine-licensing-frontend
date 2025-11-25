import { getByRole, queryByRole, getByText } from '@testing-library/dom'
import { routes } from '~/src/server/common/constants/routes.js'
import {
  setupTestServer,
  mockExemptions
} from '~/tests/integration/shared/test-setup-helpers.js'
import { loadPage } from '~/tests/integration/shared/app-server.js'
import { getExemptionsTableRow } from '~/tests/integration/shared/dom-helpers.js'

describe('Dashboard', () => {
  const getServer = setupTestServer()

  const loadDashboardPage = () =>
    loadPage({
      requestUrl: routes.DASHBOARD,
      server: getServer()
    })

  const exemptions = [
    {
      id: '123',
      projectName: 'Draft Project',
      reference: '',
      status: 'Draft',
      submittedAt: null
    },
    {
      id: '456',
      projectName: 'Active Project',
      reference: 'EXE/2025/10264',
      status: 'Active',
      submittedAt: '2025-10-23T12:00:00.000Z'
    }
  ]

  it('should render the dashboard page title, heading and Create button', async () => {
    mockExemptions(exemptions)
    const doc = await loadDashboardPage()
    expect(getByRole(doc, 'heading', { level: 1 })).toHaveTextContent(
      'Projects'
    )
    expect(
      getByRole(doc, 'button', { name: 'Create new project' })
    ).toHaveAttribute(
      'href',
      'https://marinelicensing.marinemanagement.org.uk/mmofox5/journey/self-service/start'
    )
  })

  it('should render a draft exemption', async () => {
    mockExemptions(exemptions)
    const doc = await loadDashboardPage()
    const cells = getExemptionsTableRow({
      document: doc,
      name: 'Draft Project'
    })
    const actionsCell = cells.pop()
    const cellContents = cells.map((cell) => cell.textContent)
    expect(cellContents).toEqual([
      'Draft Project',
      'Exempt activity notification',
      '-',
      'Draft',
      '-'
    ])
    expect(
      getByRole(actionsCell, 'link', { name: 'Continue to task list' })
    ).toHaveAttribute('href', '/exemption/task-list/123')
    expect(
      getByRole(actionsCell, 'link', { name: 'Delete Draft Project' })
    ).toHaveAttribute('href', '/exemption/delete/123')
  })

  it('should render an active exemption', async () => {
    mockExemptions(exemptions)
    const doc = await loadDashboardPage()
    const cells = getExemptionsTableRow({
      document: doc,
      name: 'Active Project'
    })
    const actionsCell = cells.pop()
    const cellContents = cells.map((cell) => cell.textContent)
    expect(cellContents).toEqual([
      'Active Project',
      'Exempt activity notification',
      '-',
      'Active',
      '23 Oct 2025'
    ])
    expect(
      getByRole(actionsCell, 'link', { name: 'View details of Active Project' })
    ).toHaveAttribute('href', '/exemption/view-details/456')
  })

  it('should render a message if there are no exemptions', async () => {
    mockExemptions([])
    const doc = await loadDashboardPage()
    const table = queryByRole(doc, 'table', { name: 'Projects' })
    expect(table).not.toBeInTheDocument()
    expect(
      getByText(doc, 'You currently have no projects.')
    ).toBeInTheDocument()
  })
})
