import { formatDate } from '~/src/config/nunjucks/filters/format-date.js'
import { formatProjectsForDisplay, getActionButtons } from './utils.js'
import { routes } from '~/src/server/common/constants/routes.js'

jest.mock('~/src/config/nunjucks/filters/format-date.js')

describe('#formatProjectsForDisplay', () => {
  jest.mocked(formatDate).mockImplementation((date) => {
    if (!date) return null
    if (date === '2024-01-15') return '15 Jan 2024'
    if (date === '2024-06-25') return '25 Jun 2024'
    return '01 Jan 2024'
  })

  beforeEach(() => {
    jest.clearAllMocks()
  })

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
      [
        { text: 'Test Project' },
        { text: 'Exempt activity notification' },
        { text: 'ML-2024-001' },
        {
          html: '<strong class="govuk-tag govuk-tag--light-blue">Draft</strong>'
        },
        { text: '15 Jan 2024' },
        {
          html: '<a href="/exemption/task-list/abc123" class="govuk-link govuk-!-margin-right-4 govuk-link--no-visited-state" aria-label="Continue to task list">Continue</a><a href="/exemption/delete/abc123" class="govuk-link" aria-label="Delete Test Project">Delete</a>'
        }
      ]
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
      [
        { text: 'Test Project' },
        { text: 'Exempt activity notification' },
        { text: '-' },
        {
          html: '<strong class="govuk-tag govuk-tag--light-blue">Draft</strong>'
        },
        { text: '-' },
        {
          html: '<a href="/exemption/task-list/abc123" class="govuk-link govuk-!-margin-right-4 govuk-link--no-visited-state" aria-label="Continue to task list">Continue</a><a href="/exemption/delete/abc123" class="govuk-link" aria-label="Delete Test Project">Delete</a>'
        }
      ]
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

        applicationReference: 'ML-2024-002',
        status: 'Closed',
        submittedAt: '2024-06-25'
      }
    ]

    const result = formatProjectsForDisplay(projects)

    expect(result).toHaveLength(2)
    expect(result[0]).toEqual([
      { text: 'Project 1' },
      { text: 'Exempt activity notification' },
      { text: 'ML-2024-001' },
      {
        html: '<strong class="govuk-tag govuk-tag--light-blue">Draft</strong>'
      },
      { text: '15 Jan 2024' },
      {
        html: '<a href="/exemption/task-list/abc123" class="govuk-link govuk-!-margin-right-4 govuk-link--no-visited-state" aria-label="Continue to task list">Continue</a><a href="/exemption/delete/abc123" class="govuk-link" aria-label="Delete Project 1">Delete</a>'
      }
    ])
    expect(result[1]).toEqual([
      { text: 'Project 2' },
      { text: 'Exempt activity notification' },
      { text: 'ML-2024-002' },
      {
        html: '<strong class="govuk-tag govuk-tag--green">Closed</strong>'
      },
      { text: '25 Jun 2024' },
      {
        html: '<a href="/exemption/view-details/def456" class="govuk-link" aria-label="View details of Project 2">View details</a>'
      }
    ])
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
        status: 'Closed',
        submittedAt: '2024-01-15'
      }
    ]

    const result = formatProjectsForDisplay(projects)

    expect(result[0][3].html).toContain('govuk-tag--light-blue')
    expect(result[0][3].html).toContain('Draft')
    expect(result[1][3].html).toContain('govuk-tag--green')
    expect(result[1][3].html).toContain('Closed')
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
      `<a href="${routes.TASK_LIST}/abc123" class="govuk-link govuk-!-margin-right-4 govuk-link--no-visited-state" aria-label="Continue to task list">Continue</a><a href="${routes.DELETE_EXEMPTION}/abc123" class="govuk-link" aria-label="Delete Test Project">Delete</a>`
    )
  })

  it('returns View details link when status is Closed', () => {
    const submitted = {
      id: 'abc123',
      projectName: 'Test Project',
      status: 'Closed'
    }
    const result = getActionButtons(submitted)
    expect(result).toBe(
      '<a href="/exemption/view-details/abc123" class="govuk-link" aria-label="View details of Test Project">View details</a>'
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
      '<a href="/exemption/view-details/def456" class="govuk-link" aria-label="View details of Another Project">View details</a>'
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
      '<a href="/exemption/view-details/ghi789" class="govuk-link" aria-label="View details of Unknown Status Project">View details</a>'
    )
  })
})
