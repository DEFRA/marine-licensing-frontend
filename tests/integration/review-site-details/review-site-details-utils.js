import { getByText, queryByText, within } from '@testing-library/dom'

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
    typeof siteIndex !== 'undefined' ? `?site=${siteIndex + 1}` : ''

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

export const validateIncompleteWarning = (document, expected) => {
  if (expected.hasIncompleteWarning) {
    expect(
      getByText(document, "The site details you've provided are saved.")
    ).toBeInTheDocument()
    expect(
      getByText(document, /You must complete all sections marked/i)
    ).toBeInTheDocument()
    expect(
      getByText(
        document,
        'If you cannot finish now, you can return to this page later.'
      )
    ).toBeInTheDocument()
  } else {
    expect(
      queryByText(document, "The site details you've provided are saved.")
    ).not.toBeInTheDocument()
  }
}

export const validateSiteLocationCard = (document) => {
  const card = document.querySelector('#site-location-card')
  expect(card).toBeTruthy()

  const cardTitle = card.querySelector('.govuk-summary-card__title')
  expect(cardTitle.textContent.trim()).toBe('Providing the site location')

  const methodRow = getRowByKey(card, 'Method of providing site location')
  expect(methodRow).toBeTruthy()
  expect(methodRow.textContent).toContain(
    'Enter the coordinates of the site manually'
  )
}

export const validateMultipleSites = (document, expected) => {
  const heading = document.querySelector('h1')
  expect(heading.textContent.trim()).toBe('Review site details')

  const caption = document.querySelector('.govuk-caption-l')
  expect(caption.textContent.trim()).toBe(expected.projectName)

  const cards = document.querySelectorAll('.govuk-summary-card')
  const siteDetailsCards = Array.from(cards).filter((card) => {
    const title = card.querySelector('.govuk-summary-card__title')
    return title && /^Site \d+$/.test(title.textContent.trim())
  })
  expect(siteDetailsCards).toHaveLength(expected.siteDetails.length)

  expect(
    within(document).getByRole('button', { name: 'Continue' })
  ).toHaveAttribute('type', 'submit')
}

export const validateSiteDetailsCard = (document, expected, siteIndex) => {
  const siteCard = getSiteDetailsCard(document, expected, siteIndex)

  const cardTitle = siteCard.querySelector('.govuk-summary-card__title')
  expect(cardTitle.textContent.trim()).toBe(
    expected.siteDetails[siteIndex].cardName
  )

  const siteNameRow = getRowByKey(siteCard, 'Site name')
  expect(siteNameRow).toBeTruthy()
  expect(siteNameRow.textContent).toContain(
    expected.siteDetails[siteIndex].siteName
  )

  const methodRow = getRowByKey(
    siteCard,
    'Single or multiple sets of coordinates'
  )
  expect(methodRow).toBeTruthy()
  expect(methodRow.textContent).toContain(
    expected.siteDetails[siteIndex].method
  )

  const coordinateSystemRow = getRowByKey(siteCard, 'Coordinate system')
  expect(coordinateSystemRow).toBeTruthy()
  expect(coordinateSystemRow.textContent).toContain(
    expected.siteDetails[siteIndex].coordinateSystem
  )
}
