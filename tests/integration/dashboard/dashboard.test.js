import {
  getByRole,
  queryByRole,
  getByText,
  getAllByRole
} from '@testing-library/dom'
import { routes } from '~/src/server/common/constants/routes.js'
import {
  setupTestServer,
  mockExemptions,
  mockEmployeeExemptions
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
    const cellContents = cells.map((cell) => cell.textContent.trim())
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
    const cellContents = cells.map((cell) => cell.textContent.trim())
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
      getByText(doc, 'There are no projects to display.')
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

      const nameHeader = getByRole(table, 'columnheader', {
        name: 'Project name'
      })
      const typeHeader = getByRole(table, 'columnheader', { name: 'Type' })
      const referenceHeader = getByRole(table, 'columnheader', {
        name: 'Reference'
      })
      const statusHeader = getByRole(table, 'columnheader', { name: 'Status' })
      const dateHeader = getByRole(table, 'columnheader', {
        name: /Submitted\s+on/
      })

      expect(nameHeader).toHaveAttribute('aria-sort', 'none')
      expect(typeHeader).toHaveAttribute('aria-sort', 'none')
      expect(referenceHeader).toHaveAttribute('aria-sort', 'none')
      expect(statusHeader).toHaveAttribute('aria-sort', 'descending')
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

  describe('Employee user dashboard (ML-928)', () => {
    const employeeExemptions = [
      {
        id: '123',
        projectName: 'My Draft Project',
        status: 'Draft',
        submittedAt: null,
        isOwnProject: true,
        ownerName: 'John Smith'
      },
      {
        id: '456',
        projectName: 'My Active Project',
        status: 'Active',
        submittedAt: '2025-10-23T12:00:00.000Z',
        isOwnProject: true,
        ownerName: 'John Smith'
      },
      {
        id: '789',
        projectName: 'Colleague Draft',
        status: 'Draft',
        submittedAt: null,
        isOwnProject: false,
        ownerName: 'Jane Doe'
      },
      {
        id: '101',
        projectName: 'Colleague Active',
        status: 'Active',
        submittedAt: '2025-10-20T12:00:00.000Z',
        isOwnProject: false,
        ownerName: 'Jane Doe'
      }
    ]

    it('should render filter radios for employee users', async () => {
      mockEmployeeExemptions(employeeExemptions)
      const doc = await loadDashboardPage()

      const myProjectsRadio = doc.querySelector(
        'input[name="filter"][value="my-projects"]'
      )
      const allProjectsRadio = doc.querySelector(
        'input[name="filter"][value="all-projects"]'
      )

      expect(myProjectsRadio).toBeInTheDocument()
      expect(allProjectsRadio).toBeInTheDocument()
    })

    it('should not render filter radios for non-employee users', async () => {
      mockExemptions(exemptions)
      const doc = await loadDashboardPage()

      const myProjectsRadio = doc.querySelector(
        'input[name="filter"][value="my-projects"]'
      )
      const allProjectsRadio = doc.querySelector(
        'input[name="filter"][value="all-projects"]'
      )

      expect(myProjectsRadio).not.toBeInTheDocument()
      expect(allProjectsRadio).not.toBeInTheDocument()
    })

    it('should render "My projects" as the default selected filter', async () => {
      mockEmployeeExemptions(employeeExemptions)
      const doc = await loadDashboardPage()

      const myProjectsRadio = doc.querySelector(
        'input[name="filter"][value="my-projects"]'
      )
      expect(myProjectsRadio).toBeChecked()
    })

    it('should render Owner column header for employee users', async () => {
      mockEmployeeExemptions(employeeExemptions)
      const doc = await loadDashboardPage()
      const table = getByRole(doc, 'table', { name: 'Projects' })

      const ownerHeader = getByRole(table, 'columnheader', { name: 'Owner' })
      expect(ownerHeader).toBeInTheDocument()
    })

    it('should not render Owner column header for non-employee users', async () => {
      mockExemptions(exemptions)
      const doc = await loadDashboardPage()
      const table = getByRole(doc, 'table', { name: 'Projects' })

      const headers = getAllByRole(table, 'columnheader')
      const headerTexts = headers.map((h) => h.textContent.trim())
      expect(headerTexts).not.toContain('Owner')
    })

    it('should render owner name in Owner column for employee view', async () => {
      mockEmployeeExemptions(employeeExemptions)
      const doc = await loadDashboardPage()

      const cells = getExemptionsTableRow({
        document: doc,
        name: 'My Draft Project'
      })
      const cellContents = cells.map((cell) => cell.textContent.trim())
      expect(cellContents).toContain('John Smith')
    })

    it('should set data-is-own-project attribute on table rows', async () => {
      mockEmployeeExemptions(employeeExemptions)
      const doc = await loadDashboardPage()
      const table = getByRole(doc, 'table', { name: 'Projects' })
      const rows = table.querySelectorAll('tbody tr')

      const ownProjectRow = Array.from(rows).find((row) =>
        row.textContent.includes('My Draft Project')
      )
      const otherProjectRow = Array.from(rows).find((row) =>
        row.textContent.includes('Colleague Draft')
      )

      expect(ownProjectRow).toHaveAttribute('data-is-own-project', 'true')
      expect(otherProjectRow).toHaveAttribute('data-is-own-project', 'false')
    })

    it('should show Continue and Delete actions for own draft projects', async () => {
      mockEmployeeExemptions(employeeExemptions)
      const doc = await loadDashboardPage()

      const cells = getExemptionsTableRow({
        document: doc,
        name: 'My Draft Project'
      })
      const actionsCell = cells.pop()

      expect(
        getByRole(actionsCell, 'link', { name: 'Continue to task list' })
      ).toHaveAttribute('href', '/exemption/task-list/123')
      expect(
        getByRole(actionsCell, 'link', { name: 'Delete My Draft Project' })
      ).toHaveAttribute('href', '/exemption/delete/123')
    })

    it('should show View details action for own active projects', async () => {
      mockEmployeeExemptions(employeeExemptions)
      const doc = await loadDashboardPage()

      const cells = getExemptionsTableRow({
        document: doc,
        name: 'My Active Project'
      })
      const actionsCell = cells.pop()

      expect(
        getByRole(actionsCell, 'link', {
          name: 'View details of My Active Project'
        })
      ).toHaveAttribute('href', '/exemption/view-details/456')
    })

    it('should show no actions for other users draft projects', async () => {
      mockEmployeeExemptions(employeeExemptions)
      const doc = await loadDashboardPage()

      const cells = getExemptionsTableRow({
        document: doc,
        name: 'Colleague Draft'
      })
      const actionsCell = cells.pop()

      const links = actionsCell.querySelectorAll('a')
      expect(links).toHaveLength(0)
    })

    it('should show View details action for other users active projects', async () => {
      mockEmployeeExemptions(employeeExemptions)
      const doc = await loadDashboardPage()

      const cells = getExemptionsTableRow({
        document: doc,
        name: 'Colleague Active'
      })
      const actionsCell = cells.pop()

      expect(
        getByRole(actionsCell, 'link', {
          name: 'View details of Colleague Active'
        })
      ).toHaveAttribute('href', '/exemption/view-details/101')
    })

    it('should render Update results button for non-JS fallback', async () => {
      mockEmployeeExemptions(employeeExemptions)
      const doc = await loadDashboardPage()

      const updateButton = doc.querySelector('.app-filter-submit')
      expect(updateButton).toBeInTheDocument()
      expect(updateButton.textContent.trim()).toBe('Update results')
    })

    it('should have app-project-filter data-module on radios container', async () => {
      mockEmployeeExemptions(employeeExemptions)
      const doc = await loadDashboardPage()

      const filterModule = doc.querySelector(
        '[data-module*="app-project-filter"]'
      )
      expect(filterModule).toBeInTheDocument()
    })
  })
})
