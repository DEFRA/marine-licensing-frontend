import {
  getByRole,
  queryByRole,
  getByText,
  getAllByRole,
  queryAllByRole
} from '@testing-library/dom'
import { config } from '~/src/config/config.js'
import { routes } from '~/src/server/common/constants/routes.js'
import {
  setupTestServer,
  mockExemptions,
  mockMarineLicence,
  mockEmployeeExemptions
} from '~/tests/integration/shared/test-setup-helpers.js'
import { loadPage } from '~/tests/integration/shared/app-server.js'
import { getProjectsTableRow } from '~/tests/integration/shared/dom-helpers.js'
import { makePostRequest } from '~/src/server/test-helpers/server-requests.js'
import { mockMarineLicenceApplication } from '~/src/server/test-helpers/mocks/marine-licence-mocks.js'
import { employeeSession } from '~/tests/integration/shared/session-fixtures.js'
import { getUserSession } from '~/src/server/common/plugins/auth/utils.js'
import { EXEMPTION_TYPE } from '#src/server/common/constants/exemptions.js'
import { MARINE_LICENCE_TYPE } from '#src/server/common/constants/marine-licence.js'

vi.mock('~/src/server/common/plugins/auth/utils.js')

describe('Dashboard', () => {
  const getServer = setupTestServer()

  beforeAll(() => {
    vi.mocked(getUserSession).mockResolvedValue(employeeSession)
  })

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

  const marineLicences = [
    {
      ...mockMarineLicenceApplication,
      status: 'Submitted',
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
    const cells = getProjectsTableRow({
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
    const cells = getProjectsTableRow({
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

  it('should render a submitted marine licence', async () => {
    mockMarineLicence(marineLicences)
    const doc = await loadDashboardPage()

    const cells = getProjectsTableRow({
      document: doc,
      name: mockMarineLicenceApplication.projectName
    })

    const actionsCell = cells.pop()
    const cellContents = cells.map((cell) => cell.textContent.trim())
    expect(cellContents).toEqual([
      'Test Project',
      'Marine licence application',
      '-',
      'Submitted',
      '23 Oct 2025'
    ])
    expect(
      getByRole(actionsCell, 'link', { name: 'View details of Test Project' })
    ).toHaveAttribute(
      'href',
      `/marine-licence/view-details/${mockMarineLicenceApplication.id}`
    )
    expect(
      getByRole(actionsCell, 'link', { name: 'Withdraw Test Project' })
    ).toHaveAttribute(
      'href',
      `/marine-licence/withdraw/${mockMarineLicenceApplication.id}`
    )
  })

  it('should not offer Withdraw for a submitted marine licence owned by another user', async () => {
    mockMarineLicence([{ ...marineLicences[0], isOwnProject: false }])
    const doc = await loadDashboardPage()

    const cells = getProjectsTableRow({
      document: doc,
      name: mockMarineLicenceApplication.projectName
    })
    const actionsCell = cells.pop()

    expect(
      getByRole(actionsCell, 'link', { name: 'View details of Test Project' })
    ).toBeInTheDocument()
    expect(
      queryByRole(actionsCell, 'link', { name: 'Withdraw Test Project' })
    ).not.toBeInTheDocument()
  })

  it('should render a withdrawn marine licence with View details only', async () => {
    mockMarineLicence([
      {
        ...marineLicences[0],
        status: 'Withdrawn',
        applicationReference: 'MLA/2025/10018'
      }
    ])
    const doc = await loadDashboardPage()

    const cells = getProjectsTableRow({
      document: doc,
      name: mockMarineLicenceApplication.projectName
    })
    const actionsCell = cells.pop()
    const cellContents = cells.map((cell) => cell.textContent.trim())
    expect(cellContents).toEqual([
      'Test Project',
      'Marine licence application',
      'MLA/2025/10018',
      'Withdrawn',
      '23 Oct 2025'
    ])

    expect(
      getByRole(actionsCell, 'link', { name: 'View details of Test Project' })
    ).toHaveAttribute(
      'href',
      `/marine-licence/view-details/${mockMarineLicenceApplication.id}`
    )
    expect(
      queryByRole(actionsCell, 'link', { name: 'Withdraw Test Project' })
    ).not.toBeInTheDocument()
  })

  it('should render a message if there are no projects', async () => {
    mockExemptions([])
    const doc = await loadDashboardPage()
    const table = queryByRole(doc, 'table', { name: 'Projects' })

    const row = table.querySelectorAll('tbody tr')
    expect(row.length).toBe(0)

    expect(
      getByText(doc, 'There are no submissions to display.')
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

      const draftRow = getProjectsTableRow({
        document: doc,
        name: 'Draft Project'
      })
      const draftDateCell = draftRow[4]
      expect(draftDateCell).toHaveAttribute('data-sort-value', '0')

      const activeRow = getProjectsTableRow({
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

      const cells = getProjectsTableRow({
        document: doc,
        name: 'My Draft Project'
      })
      const cellContents = cells.map((cell) => cell.textContent.trim())
      expect(cellContents).toContain('John Smith')
    })

    it('should show Continue and Delete actions for own draft projects', async () => {
      mockEmployeeExemptions(employeeExemptions)
      const doc = await loadDashboardPage()

      const cells = getProjectsTableRow({
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

      const cells = getProjectsTableRow({
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

      const cells = getProjectsTableRow({
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

      const cells = getProjectsTableRow({
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
  })

  describe('Filter', () => {
    describe('when marine licence is enabled', () => {
      beforeAll(() => {
        config.set('marineLicence.enabled', true)
      })

      afterAll(() => {
        config.set('marineLicence.enabled', false)
      })

      it('should render table with moj-filter module for employees', async () => {
        mockEmployeeExemptions(employeeExemptions)
        const doc = await loadDashboardPage()
        const filter = doc.querySelector('.moj-filter')
        expect(filter).toHaveAttribute('data-module', 'moj-filter')

        expect(
          queryAllByRole(filter, 'button', { name: 'Clear filters' })
        ).toHaveLength(1)

        expect(
          getByRole(filter, 'button', { name: 'Apply filters' })
        ).toBeInTheDocument()

        expect(
          getByRole(filter, 'heading', {
            name: 'Selected filters'
          })
        ).toBeInTheDocument()

        expect(filter.querySelectorAll('.moj-filter__tag').length).toBe(0)

        expect(
          getByRole(filter, 'group', {
            name: 'Show'
          })
        ).toBeInTheDocument()

        const orgSubmissionRadio = getByRole(filter, 'radio', {
          name: 'All Test Org submissions'
        })

        const mySubmissionRadio = getByRole(filter, 'radio', {
          name: 'My submissions'
        })

        expect(orgSubmissionRadio).not.toBeChecked()
        expect(mySubmissionRadio).toBeChecked()

        const statusGroup = getByRole(filter, 'group', {
          name: 'Status'
        })
        expect(statusGroup).toBeInTheDocument()

        const statuses = [
          'Active',
          'Draft',
          'Submitted',
          'Transferred',
          'Unable to progress',
          'Withdrawn'
        ]

        statuses.forEach((status) => {
          const checkbox = getByRole(statusGroup, 'checkbox', {
            name: status
          })
          expect(checkbox).not.toBeChecked()
        })

        const typeGroup = getByRole(filter, 'group', {
          name: 'Submission type'
        })
        expect(typeGroup).toBeInTheDocument()

        const typeValues = [EXEMPTION_TYPE, MARINE_LICENCE_TYPE]

        typeValues.forEach((type) => {
          const checkbox = getByRole(typeGroup, 'checkbox', { name: type })
          expect(checkbox).not.toBeChecked()
        })
      })
    })

    describe('when marine licence is disabled', () => {
      beforeAll(() => {
        config.set('marineLicence.enabled', false)
      })

      it('should only show Active and Draft statuses and hide the Submission type filter', async () => {
        mockEmployeeExemptions(employeeExemptions)
        const doc = await loadDashboardPage()
        const filter = doc.querySelector('.moj-filter')

        const statusGroup = getByRole(filter, 'group', {
          name: 'Status'
        })

        ;['Active', 'Draft'].forEach((status) => {
          expect(
            getByRole(statusGroup, 'checkbox', { name: status })
          ).not.toBeChecked()
        })
        ;[
          'Submitted',
          'Transferred',
          'Unable to progress',
          'Withdrawn'
        ].forEach((status) => {
          expect(
            queryByRole(statusGroup, 'checkbox', { name: status })
          ).not.toBeInTheDocument()
        })

        expect(
          queryByRole(filter, 'group', { name: 'Submission type' })
        ).not.toBeInTheDocument()
      })
    })

    it('should not render table with moj-filter module for individuals', async () => {
      mockExemptions(exemptions)
      const doc = await loadDashboardPage()
      const filter = doc.querySelector('.moj-filter')
      expect(filter).toBeFalsy()
    })

    describe('Invalid filter payload', () => {
      it('should redirect to the dashboard when the no-JS payload fails validation', async () => {
        const response = await makePostRequest({
          url: routes.DASHBOARD,
          server: getServer(),
          formData: { show: 'not-a-value' }
        })

        expect(response.statusCode).toBe(302)
        expect(response.headers.location).toBe(routes.DASHBOARD)
      })

      it('should return a 400 when the JS-fetch payload fails validation', async () => {
        const response = await makePostRequest({
          url: routes.DASHBOARD,
          server: getServer(),
          formData: { show: 'not-a-value' },
          headers: { 'x-requested-with': 'XMLHttpRequest' }
        })

        expect(response.statusCode).toBe(400)
      })
    })
  })
})
