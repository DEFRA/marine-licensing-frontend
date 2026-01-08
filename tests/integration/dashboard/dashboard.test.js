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

  describe('Sortable table integration', () => {
    it('should render table with moj-sortable-table data-module', async () => {
      mockExemptions(exemptions)
      const doc = await loadDashboardPage()
      const table = getByRole(doc, 'table', { name: 'Projects' })
      expect(table).toHaveAttribute('data-module', 'moj-sortable-table')
    })

    it('should set aria-sort on sortable column headers', async () => {
      mockExemptions(exemptions)
      const doc = await loadDashboardPage()
      const table = getByRole(doc, 'table', { name: 'Projects' })

      const nameHeader = getByRole(table, 'columnheader', { name: 'Name' })
      const typeHeader = getByRole(table, 'columnheader', { name: 'Type' })
      const referenceHeader = getByRole(table, 'columnheader', {
        name: 'Reference'
      })
      const statusHeader = getByRole(table, 'columnheader', { name: 'Status' })
      const dateHeader = getByRole(table, 'columnheader', {
        name: 'Date submitted'
      })

      expect(nameHeader).toHaveAttribute('aria-sort', 'none')
      expect(typeHeader).toHaveAttribute('aria-sort', 'none')
      expect(referenceHeader).toHaveAttribute('aria-sort', 'none')
      expect(statusHeader).toHaveAttribute('aria-sort', 'none')
      expect(dateHeader).toHaveAttribute('aria-sort', 'none')
    })

    it('should not set aria-sort on Actions column', async () => {
      mockExemptions(exemptions)
      const doc = await loadDashboardPage()
      const table = getByRole(doc, 'table', { name: 'Projects' })

      const actionsHeader = getByRole(table, 'columnheader', {
        name: 'Actions'
      })
      expect(actionsHeader).not.toHaveAttribute('aria-sort')
    })

    it('should set data-sort-value on date cells for proper sorting', async () => {
      mockExemptions(exemptions)
      const doc = await loadDashboardPage()

      const draftRow = getExemptionsTableRow({
        document: doc,
        name: 'Draft Project'
      })
      const draftDateCell = draftRow[4]
      expect(draftDateCell).toHaveAttribute('data-sort-value', '0')

      const activeRow = getExemptionsTableRow({
        document: doc,
        name: 'Active Project'
      })
      const activeDateCell = activeRow[4]
      expect(activeDateCell).toHaveAttribute(
        'data-sort-value',
        '2025-10-23T12:00:00.000Z'
      )
    })
  })

  describe('default sort order', () => {
    it('should render projects sorted by status Z-A (Draft before Active)', async () => {
      const unsortedExemptions = [
        {
          id: '456',
          projectName: 'Active Project',
          status: 'Active',
          submittedAt: '2025-10-23T12:00:00.000Z'
        },
        {
          id: '123',
          projectName: 'Draft Project',
          status: 'Draft',
          submittedAt: null
        }
      ]
      mockExemptions(unsortedExemptions)
      const doc = await loadDashboardPage()
      const table = getByRole(doc, 'table', { name: 'Projects' })
      const rows = table.querySelectorAll('tbody tr')

      expect(rows[0]).toHaveTextContent('Draft Project')
      expect(rows[1]).toHaveTextContent('Active Project')
    })
  })
})
