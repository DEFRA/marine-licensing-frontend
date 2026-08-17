import { getByRole, getByText } from '@testing-library/dom'
import { renderComponentJSDOM } from '#src/server/test-helpers/component-helpers.js'

describe('Survey Link Component', () => {
  let document

  beforeEach(() => {
    document = renderComponentJSDOM('survey-link', {
      href: 'https://forms.cloud.microsoft/e/test-survey'
    })
  })

  test('Should render the survey link with the supplied href', () => {
    const surveyLink = getByRole(document, 'link', {
      name: 'What did you think of this service?'
    })
    expect(surveyLink).toBeInTheDocument()
    expect(surveyLink.getAttribute('href')).toBe(
      'https://forms.cloud.microsoft/e/test-survey'
    )
    expect(surveyLink).toHaveClass('govuk-link')
    expect(surveyLink.getAttribute('rel')).toBe('noopener noreferrer')
  })

  test('Should render the hint text outside the link', () => {
    const paragraph = getByText(document, /\(takes 30 seconds\)/)
    expect(paragraph).toBeInTheDocument()
    expect(paragraph).toHaveClass('govuk-body')

    const surveyLink = getByRole(document, 'link', {
      name: 'What did you think of this service?'
    })
    expect(surveyLink.textContent).not.toContain('takes 30 seconds')
  })
})
