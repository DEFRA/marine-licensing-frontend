/**
 * Shared validation utilities for summary card testing
 * Used across check-your-answers and view-details integration tests
 * @jest-environment jsdom
 */

/* eslint-env jest */

/**
 * Validates the basic page structure (heading and back link)
 * @param {Document} document - JSDOM document
 * @param {object} expected - Expected page content
 * @param {string} expected.pageTitle - Expected page title
 * @param {string} expected.backLinkText - Expected back link text
 * @param {string} [expected.pageCaption] - Optional page caption
 * @param {string} [expected.backLinkHref] - Optional back link href for view-details
 */
export const validatePageStructure = (document, expected) => {
  // Handle different heading selectors for different page types
  const heading =
    document.querySelector('#check-your-answers-heading') ??
    document.querySelector('h1')
  expect(heading.textContent.trim()).toBe(expected.pageTitle)

  if (expected.pageCaption) {
    const caption = document.querySelector('.govuk-caption-l')
    expect(caption).toHaveTextContent(expected.pageCaption)
  }

  const backLink = document.querySelector('.govuk-back-link')
  expect(backLink.textContent.trim()).toBe(expected.backLinkText)

  if (expected.backLinkHref) {
    expect(backLink).toHaveAttribute('href', expected.backLinkHref)
  }
}

/**
 * Validates that all expected summary cards exist on the page
 * @param {Document} document - JSDOM document
 * @param {object} expected - Expected page content
 * @param {string[]} expected.summaryCards - Array of expected card titles
 */
export const validateAllSummaryCardsExist = (document, expected) => {
  expected.summaryCards.forEach((expectedTitle) => {
    const cardTitles = document.querySelectorAll('.govuk-summary-card__title')
    const foundCard = Array.from(cardTitles).find(
      (title) => title.textContent.trim() === expectedTitle
    )
    expect(foundCard).toBeTruthy()
  })
}

/**
 * Validates the content of a specific summary card
 * @param {Document} document - JSDOM document
 * @param {string} cardSelector - CSS selector for the card
 * @param {object} expectedContent - Expected key-value pairs
 */
export const validateSummaryCardContent = (
  document,
  cardSelector,
  expectedContent
) => {
  const card = document.querySelector(cardSelector)
  expect(card).toBeTruthy()

  Object.entries(expectedContent).forEach(([key, value]) => {
    const rows = card.querySelectorAll('.govuk-summary-list__row')
    const row = Array.from(rows).find((row) => {
      const keyElement = row.querySelector('.govuk-summary-list__key')
      return keyElement && keyElement.textContent.trim() === key
    })
    expect(row).toBeTruthy()
    const valueElement = row.querySelector('.govuk-summary-list__value')
    expect(valueElement.textContent.trim()).toBe(value)
  })
}

/**
 * Validates project details summary card
 * @param {Document} document - JSDOM document
 * @param {object} expected - Expected page content
 */
export const validateProjectDetails = (document, expected) => {
  validateSummaryCardContent(
    document,
    '#project-details-card',
    expected.projectDetails
  )
}

/**
 * Validates activity dates summary card
 * @param {Document} document - JSDOM document
 * @param {object} expected - Expected page content
 */
export const validateActivityDates = (document, expected) => {
  validateSummaryCardContent(
    document,
    '#activity-dates-card',
    expected.activityDates
  )
}

/**
 * Validates activity details summary card
 * @param {Document} document - JSDOM document
 * @param {object} expected - Expected page content
 */
export const validateActivityDetails = (document, expected) => {
  validateSummaryCardContent(
    document,
    '#activity-details-card',
    expected.activityDetails
  )
}

/**
 * Validates public register summary card
 * @param {Document} document - JSDOM document
 * @param {object} expected - Expected page content
 */
export const validatePublicRegister = (document, expected) => {
  validateSummaryCardContent(
    document,
    '#public-register-card',
    expected.publicRegister
  )
}

/**
 * Validates site details summary card with support for extended content
 * @param {Document} document - JSDOM document
 * @param {object} expectedPageContent - Expected page content
 */
export const validateSiteDetails = (document, expectedPageContent) => {
  const siteCard = document.querySelector('#site-details-card')
  expect(siteCard).toBeTruthy()

  // Validate basic site details if present
  if (expectedPageContent.siteDetails) {
    Object.entries(expectedPageContent.siteDetails).forEach(([key, value]) => {
      const rows = siteCard.querySelectorAll('.govuk-summary-list__row')
      const row = Array.from(rows).find((row) => {
        const keyElement = row.querySelector('.govuk-summary-list__key')
        return keyElement && keyElement.textContent.trim() === key
      })
      expect(row).toBeTruthy()
      const valueElement = row.querySelector('.govuk-summary-list__value')
      expect(valueElement.textContent.trim()).toBe(value)
    })
  }

  // Validate extended site details (coordinate points) if present
  if (expectedPageContent.siteDetailsExtended?.coordinatePoints) {
    expectedPageContent.siteDetailsExtended.coordinatePoints.forEach(
      (point) => {
        const pointText = siteCard.textContent.includes(point)
        expect(pointText).toBe(true)
      }
    )
  }
}
