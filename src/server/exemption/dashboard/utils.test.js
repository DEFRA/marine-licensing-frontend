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
        type: 'Exempt activity',
        applicationReference: 'ML-2024-001',
        status: 'Draft',
        submittedAt: '2024-01-15'
      }
    ]

    const result = formatProjectsForDisplay(projects)

    expect(result).toEqual([
      [
        { text: 'Test Project' },
        { text: 'Exempt activity' },
        { text: 'ML-2024-001' },
        {
          html: '<strong class="govuk-tag govuk-tag--light-blue">Draft</strong>'
        },
        { text: '15 Jan 2024' },
        {
          html: '<a href="/exemption/task-list/abc123" class="govuk-link" aria-label="Continue to task list">Continue</a>'
        }
      ]
    ])
  })

  test('Should format project with missing data', () => {
    const projects = [
      {
        id: 'abc123',
        projectName: 'Test Project',
        type: 'Exempt activity',
        applicationReference: null,
        status: 'Draft',
        submittedAt: null
      }
    ]

    const result = formatProjectsForDisplay(projects)

    expect(result).toEqual([
      [
        { text: 'Test Project' },
        { text: 'Exempt activity' },
        { text: '-' },
        {
          html: '<strong class="govuk-tag govuk-tag--light-blue">Draft</strong>'
        },
        { text: '-' },
        {
          html: '<a href="/exemption/task-list/abc123" class="govuk-link" aria-label="Continue to task list">Continue</a>'
        }
      ]
    ])
  })

  test('Should format multiple projects correctly', () => {
    const projects = [
      {
        id: 'abc123',
        projectName: 'Project 1',
        type: 'Exempt activity',
        applicationReference: 'ML-2024-001',
        status: 'Draft',
        submittedAt: '2024-01-15'
      },
      {
        projectName: 'Project 2',
        type: 'Exempt activity',
        applicationReference: 'ML-2024-002',
        status: 'Closed',
        submittedAt: '2024-06-25'
      }
    ]

    const result = formatProjectsForDisplay(projects)

    expect(result).toHaveLength(2)
    expect(result[0]).toEqual([
      { text: 'Project 1' },
      { text: 'Exempt activity' },
      { text: 'ML-2024-001' },
      {
        html: '<strong class="govuk-tag govuk-tag--light-blue">Draft</strong>'
      },
      { text: '15 Jan 2024' },
      {
        html: '<a href="/exemption/task-list/abc123" class="govuk-link" aria-label="Continue to task list">Continue</a>'
      }
    ])
    expect(result[1]).toEqual([
      { text: 'Project 2' },
      { text: 'Exempt activity' },
      { text: 'ML-2024-002' },
      {
        html: '<strong class="govuk-tag govuk-tag--green">Closed</strong>'
      },
      { text: '25 Jun 2024' },
      { html: '' }
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
        type: 'Exempt activity',
        applicationReference: 'ML-2024-001',
        status: 'Draft',
        submittedAt: '2024-01-15'
      },
      {
        projectName: 'Test Project',
        type: 'Exempt activity',
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
    const draft = { id: 'abc123', status: 'Draft' }
    const result = getActionButtons(draft)
    expect(result).toBe(
      `<a href="${routes.TASK_LIST}/abc123" class="govuk-link" aria-label="Continue to task list">Continue</a>`
    )
  })

  it('returns no html when not a draft', () => {
    const submitted = { id: 'abc123', status: 'Closed' }
    const result = getActionButtons(submitted)
    expect(result).toBe('')
  })
})
