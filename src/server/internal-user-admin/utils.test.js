import { formatProjectsForDisplay } from './utils.js'

describe('#formatProjectsForDisplay', () => {
  const csrfToken = '123'
  test('Should format multiple projects correctly', () => {
    const projects = [
      {
        _id: 'abc123',
        projectName: 'Project 1',

        applicationReference: 'ML-2024-001',
        status: 'Draft',
        submittedAt: '2024-01-15T08:00:00.000Z',
        previouslyFailedAt: '2024-01-14T10:30:00.000Z'
      },
      {
        _id: 'def456',
        projectName: 'Project 2',

        applicationReference: 'ML-2024-002',
        status: 'Active',
        submittedAt: '2024-06-25T12:15:30.000Z',
        previouslyFailedAt: '2024-06-24T14:45:00.000Z'
      }
    ]

    const result = formatProjectsForDisplay(projects, csrfToken)

    expect(result).toHaveLength(2)
    expect(result[0]).toEqual([
      { text: 'Project 1' },
      { text: 'ML-2024-001' },
      {
        text: '15 Jan 2024'
      },
      {
        text: '14 Jan 2024 10:30'
      },
      {
        html: `<form method="POST">
        <input type="hidden" name="csrfToken" value="123">
        <input type="hidden" name="exemptionId" value="abc123">
        <button type="submit" class="govuk-button govuk-button--secondary" data-module="govuk-button">
          Send to EMP
        </button>
      </form>`
      }
    ])
    expect(result[1]).toEqual([
      { text: 'Project 2' },
      { text: 'ML-2024-002' },
      {
        text: '25 Jun 2024'
      },
      {
        text: '24 Jun 2024 14:45'
      },
      {
        html: `<form method="POST">
        <input type="hidden" name="csrfToken" value="123">
        <input type="hidden" name="exemptionId" value="def456">
        <button type="submit" class="govuk-button govuk-button--secondary" data-module="govuk-button">
          Send to EMP
        </button>
      </form>`
      }
    ])
  })

  test('Should handle empty projects array', () => {
    const result = formatProjectsForDisplay([], csrfToken)

    expect(result).toEqual([])
  })
})
