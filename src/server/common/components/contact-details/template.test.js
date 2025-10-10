import { getByRole, getByText } from '@testing-library/dom'
import { renderComponentJSDOM } from '#src/server/test-helpers/component-helpers.js'

describe('Contact Details Component', () => {
  let document

  beforeEach(() => {
    document = renderComponentJSDOM('contact-details', {})
  })

  test('Should render phone section with correct heading and number', () => {
    const phoneHeading = getByRole(document, 'heading', { name: 'Phone' })
    expect(phoneHeading).toBeInTheDocument()
    expect(phoneHeading.tagName).toBe('H2')

    const phoneNumber = getByText(document, '0191 376 2791')
    expect(phoneNumber).toBeInTheDocument()
  })

  test('Should render email section with correct heading and link', () => {
    const emailHeading = getByRole(document, 'heading', { name: 'Email' })
    expect(emailHeading).toBeInTheDocument()
    expect(emailHeading.tagName).toBe('H2')

    const emailLink = getByRole(document, 'link', {
      name: 'marine.consents@marinemanagement.org.uk'
    })
    expect(emailLink).toBeInTheDocument()
    expect(emailLink.getAttribute('href')).toBe(
      'mailto:marine.consents@marinemanagement.org.uk'
    )
  })

  test('Should render opening times section with correct heading and times', () => {
    const openingTimesHeading = getByRole(document, 'heading', {
      name: 'Opening times'
    })
    expect(openingTimesHeading).toBeInTheDocument()
    expect(openingTimesHeading.tagName).toBe('H2')

    const mondayToThursday = getByText(
      document,
      'Monday to Thursday: 9am to 4:30pm'
    )
    expect(mondayToThursday).toBeInTheDocument()

    const friday = getByText(document, 'Friday: 9am to 4pm')
    expect(friday).toBeInTheDocument()
  })

  test('Should have correct GOV.UK Design System classes', () => {
    const headings = document.querySelectorAll('h2')
    headings.forEach((heading) => {
      expect(heading.classList.contains('govuk-heading-m')).toBe(true)
      expect(heading.classList.contains('govuk-!-margin-bottom-1')).toBe(true)
    })

    const paragraphs = document.querySelectorAll('p')
    paragraphs.forEach((paragraph) => {
      expect(paragraph.classList.contains('govuk-body')).toBe(true)
    })

    const emailLink = getByRole(document, 'link')
    expect(emailLink.classList.contains('govuk-link')).toBe(true)
  })
})
