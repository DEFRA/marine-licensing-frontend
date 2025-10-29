import { within } from '@testing-library/dom'

export const getSiteDetailsCard = (document, expected, siteIndex = 0) => {
  const cardName = expected?.siteDetails[siteIndex]?.cardName ?? 'Site details'
  const heading = within(document).getByRole('heading', {
    level: 2,
    name: cardName
  })
  return heading.closest('.govuk-summary-card')
}
export const validatePageStructure = (document, expected) => {
  const heading = document.querySelector('h1')
  expect(heading.textContent.trim()).toBe('Review site details')

  const caption = document.querySelector('.govuk-caption-l')
  expect(caption.textContent.trim()).toBe(expected.projectName)

  const backLink = document.querySelector('.govuk-back-link')
  expect(backLink.textContent.trim()).toBe('Back')
  expect(backLink.getAttribute('href')).toBe(expected.backLink)
}

export const validateActionLink = (row, value, siteIndex) => {
  const actionList = row.querySelector('.govuk-summary-list__actions')
  expect(actionList).toBeTruthy()

  const hasValue = value && value !== '' && value !== 'Incomplete'
  const expectedText = hasValue ? /Change/i : /Add/i

  const actionLink = within(actionList).getByRole('link', {
    name: expectedText
  })

  const siteHref =
    typeof siteIndex !== 'undefined'
      ? `?site=${siteIndex + 1}&action=${hasValue ? 'change' : 'add'}`
      : `?action=${hasValue ? 'change' : 'add'}`

  expect(actionLink).toHaveAttribute('href', expect.stringContaining(siteHref))
}

export const validateNavigationElements = (document) => {
  expect(
    within(document).getByRole('button', { name: 'Continue' })
  ).toHaveAttribute('type', 'submit')
}

export const getRowByKey = (card, keyText) => {
  const rows = card.querySelectorAll('.govuk-summary-list__row')
  return Array.from(rows).find((row) => {
    const keyElement = row.querySelector('.govuk-summary-list__key')
    return keyElement && keyElement.textContent.trim() === keyText
  })
}
