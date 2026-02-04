import { vi } from 'vitest'
import {
  sortProjectsByStatus,
  formatProjectsForDisplay,
  getActionButtons
} from './utils.js'
import { routes } from '#src/server/common/constants/routes.js'

vi.mock('~/src/config/nunjucks/filters/format-date.js', () => ({
  formatDate: vi.fn((date) => {
    if (!date) return ''
    if (date === '2024-01-15') return '15 Jan 2024'
    if (date === '2024-06-25') return '25 Jun 2024'
    return '01 Jan 2024'
  })
}))

describe('#sortProjectsByStatus', () => {
  it('sorts projects by status Z-A (Draft before Active)', () => {
    const projects = [
      { projectName: 'Project A', status: 'Active' },
      { projectName: 'Project B', status: 'Draft' }
    ]

    const result = sortProjectsByStatus(projects)

    expect(result[0].status).toBe('Draft')
    expect(result[1].status).toBe('Active')
  })

  it('maintains original order for projects with same status', () => {
    const projects = [
      { projectName: 'Alpha', status: 'Draft' },
      { projectName: 'Beta', status: 'Draft' }
    ]

    const result = sortProjectsByStatus(projects)

    expect(result[0].projectName).toBe('Alpha')
    expect(result[1].projectName).toBe('Beta')
  })

  it('returns empty array for empty input', () => {
    expect(sortProjectsByStatus([])).toEqual([])
  })

  it('returns single project unchanged', () => {
    const projects = [{ projectName: 'Solo', status: 'Draft' }]

    const result = sortProjectsByStatus(projects)

    expect(result).toEqual(projects)
  })

  it('does not mutate the original array', () => {
    const projects = [
      { projectName: 'A', status: 'Active' },
      { projectName: 'B', status: 'Draft' }
    ]
    const originalFirst = projects[0]

    sortProjectsByStatus(projects)

    expect(projects[0]).toBe(originalFirst)
  })

  it('handles projects with null or undefined status', () => {
    const projects = [
      { projectName: 'Project A', status: 'Draft' },
      { projectName: 'Project B', status: null },
      { projectName: 'Project C', status: undefined }
    ]

    const result = sortProjectsByStatus(projects)

    expect(result[0].status).toBe('Draft')
  })
})

describe('#formatProjectsForDisplay', () => {
  test('Should format a complete project with all fields', () => {
    const projects = [
      {
        id: 'abc123',
        projectName: 'Test Project',
        applicationReference: 'ML-2024-001',
        status: 'Draft',
        submittedAt: '2024-01-15'
      }
    ]

    const result = formatProjectsForDisplay(projects)

    expect(result).toEqual([
      {
        attributes: { 'data-is-own-project': 'true' },
        cells: [
          { text: 'Test Project' },
          { text: 'Exempt activity notification' },
          { text: 'ML-2024-001' },
          {
            html: '<strong class="govuk-tag govuk-tag--light-blue">Draft</strong>'
          },
          {
            text: '15 Jan 2024',
            attributes: { 'data-sort-value': '2024-01-15' }
          },
          {
            html: '<a href="/exemption/task-list/abc123" class="govuk-link govuk-!-margin-right-4 govuk-link--no-visited-state" aria-label="Continue to task list">Continue</a><a href="/exemption/delete/abc123" class="govuk-link govuk-link--no-visited-state" aria-label="Delete Test Project">Delete</a>'
          }
        ]
      }
    ])
  })

  test('Should format project with missing data', () => {
    const projects = [
      {
        id: 'abc123',
        projectName: 'Test Project',

        applicationReference: null,
        status: 'Draft',
        submittedAt: null
      }
    ]

    const result = formatProjectsForDisplay(projects)

    expect(result).toEqual([
      {
        attributes: { 'data-is-own-project': 'true' },
        cells: [
          { text: 'Test Project' },
          { text: 'Exempt activity notification' },
          { text: '-' },
          {
            html: '<strong class="govuk-tag govuk-tag--light-blue">Draft</strong>'
          },
          {
            text: '-',
            attributes: { 'data-sort-value': 0 }
          },
          {
            html: '<a href="/exemption/task-list/abc123" class="govuk-link govuk-!-margin-right-4 govuk-link--no-visited-state" aria-label="Continue to task list">Continue</a><a href="/exemption/delete/abc123" class="govuk-link govuk-link--no-visited-state" aria-label="Delete Test Project">Delete</a>'
          }
        ]
      }
    ])
  })

  test('Should format multiple projects correctly', () => {
    const projects = [
      {
        id: 'abc123',
        projectName: 'Project 1',

        applicationReference: 'ML-2024-001',
        status: 'Draft',
        submittedAt: '2024-01-15'
      },
      {
        id: 'def456',
        projectName: 'Project 2',
        isOwnProject: true,
        applicationReference: 'ML-2024-002',
        status: 'Active',
        submittedAt: '2024-06-25'
      }
    ]

    const result = formatProjectsForDisplay(projects)

    expect(result).toHaveLength(2)
    expect(result[0]).toEqual({
      attributes: { 'data-is-own-project': 'true' },
      cells: [
        { text: 'Project 1' },
        { text: 'Exempt activity notification' },
        { text: 'ML-2024-001' },
        {
          html: '<strong class="govuk-tag govuk-tag--light-blue">Draft</strong>'
        },
        {
          text: '15 Jan 2024',
          attributes: { 'data-sort-value': '2024-01-15' }
        },
        {
          html: '<a href="/exemption/task-list/abc123" class="govuk-link govuk-!-margin-right-4 govuk-link--no-visited-state" aria-label="Continue to task list">Continue</a><a href="/exemption/delete/abc123" class="govuk-link govuk-link--no-visited-state" aria-label="Delete Project 1">Delete</a>'
        }
      ]
    })
    expect(result[1]).toEqual({
      attributes: { 'data-is-own-project': 'true' },
      cells: [
        { text: 'Project 2' },
        { text: 'Exempt activity notification' },
        { text: 'ML-2024-002' },
        {
          html: '<strong class="govuk-tag govuk-tag--green">Active</strong>'
        },
        {
          text: '25 Jun 2024',
          attributes: { 'data-sort-value': '2024-06-25' }
        },
        {
          html: '<a href="/exemption/view-details/def456" class="govuk-link govuk-!-margin-right-4 govuk-link--no-visited-state" aria-label="View details of Project 2">View details</a><a href="/exemption/withdraw/def456" class="govuk-link govuk-link--no-visited-state" aria-label="Withdraw Project 2">Withdraw</a>'
        }
      ]
    })
  })

  test('Should handle empty projects array', () => {
    const result = formatProjectsForDisplay([])

    expect(result).toEqual([])
  })

  test('Should use correct tag for status', () => {
    const projects = [
      {
        projectName: 'Test Project',
        applicationReference: 'ML-2024-001',
        status: 'Draft',
        submittedAt: '2024-01-15'
      },
      {
        projectName: 'Test Project',
        applicationReference: 'ML-2024-001',
        status: 'Active',
        submittedAt: '2024-01-15'
      },
      {
        projectName: 'Test Withdrawn Project',
        applicationReference: 'ML-2024-001',
        status: 'Withdrawn',
        submittedAt: '2024-01-15'
      }
    ]

    const result = formatProjectsForDisplay(projects)

    expect(result[0].cells[3].html).toContain('govuk-tag--light-blue')
    expect(result[0].cells[3].html).toContain('Draft')
    expect(result[1].cells[3].html).toContain('govuk-tag--green')
    expect(result[1].cells[3].html).toContain('Active')
    expect(result[2].cells[3].html).toContain('govuk-tag--grey')
    expect(result[2].cells[3].html).toContain('Withdrawn')
  })
})

describe('getActionButtons', () => {
  it('returns Continue button for draft exemption', () => {
    const draft = {
      id: 'abc123',
      projectName: 'Test Project',
      status: 'Draft'
    }
    const result = getActionButtons(draft)
    expect(result).toBe(
      `<a href="${routes.TASK_LIST}/abc123" class="govuk-link govuk-!-margin-right-4 govuk-link--no-visited-state" aria-label="Continue to task list">Continue</a><a href="${routes.DELETE_EXEMPTION}/abc123" class="govuk-link govuk-link--no-visited-state" aria-label="Delete Test Project">Delete</a>`
    )
  })

  it('returns View details and Withdraw links when status is Active', () => {
    const active = {
      id: 'abc123',
      projectName: 'Test Project',
      status: 'Active',
      isOwnProject: true
    }
    const result = getActionButtons(active)
    expect(result).toBe(
      `<a href="${routes.VIEW_DETAILS}/abc123" class="govuk-link govuk-!-margin-right-4 govuk-link--no-visited-state" aria-label="View details of Test Project">View details</a><a href="${routes.WITHDRAW_EXEMPTION}/abc123" class="govuk-link govuk-link--no-visited-state" aria-label="Withdraw Test Project">Withdraw</a>`
    )
  })

  it('does not output withdraw when user does not own project', () => {
    const active = {
      id: 'abc123',
      projectName: 'Test Project',
      status: 'Active',
      isOwnProject: false
    }
    const result = getActionButtons(active)
    expect(result).toBe(
      `<a href="${routes.VIEW_DETAILS}/abc123" class="govuk-link govuk-link--no-visited-state" aria-label="View details of Test Project">View details</a>`
    )
  })

  it('returns View details link when status is Submitted', () => {
    const submitted = {
      id: 'def456',
      projectName: 'Another Project',
      status: 'Submitted'
    }
    const result = getActionButtons(submitted)
    expect(result).toBe(
      '<a href="/exemption/view-details/def456" class="govuk-link govuk-link--no-visited-state" aria-label="View details of Another Project">View details</a>'
    )
  })

  it('returns View details link for any non-Draft status', () => {
    const unknown = {
      id: 'ghi789',
      projectName: 'Unknown Status Project',
      status: 'Unknown'
    }
    const result = getActionButtons(unknown)
    expect(result).toBe(
      '<a href="/exemption/view-details/ghi789" class="govuk-link govuk-link--no-visited-state" aria-label="View details of Unknown Status Project">View details</a>'
    )
  })
})
