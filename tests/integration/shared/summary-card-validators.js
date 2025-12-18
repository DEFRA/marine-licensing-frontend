// @vitest-environment jsdom

/* eslint-env vitest */
import { within } from '@testing-library/dom'

const GOV_UK_SUMMARY_LIST_KEY = '.govuk-summary-list__key'
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

  if (expected.backLinkText) {
    const backLink = document.querySelector('.govuk-back-link')
    expect(backLink.textContent.trim()).toBe(expected.backLinkText)
    if (expected.backLinkHref) {
      expect(backLink).toHaveAttribute('href', expected.backLinkHref)
    }
  }
}

/**
 * Validates that all expected summary cards exist on the page
 * @param {Document} document - JSDOM document
 * @param {object} expected - Expected page content
 */
export const validateAllSummaryCardsExist = (document, expected) => {
  for (const expectedTitle of expected.summaryCards) {
    expect(
      within(document).getByRole('heading', { level: 2, name: expectedTitle })
    ).toBeInTheDocument()
  }
}
/**
 * Validates that any summary cards expected to be missing, are not on the page
 * @param {Document} document - JSDOM document
 * @param {object} expected - Expected page content
 */
export const validateAnySummaryCardsMissing = (document, expected) => {
  for (const expectedTitle of expected.summaryCardsMissing ?? []) {
    expect(
      within(document).queryByRole('heading', { level: 2, name: expectedTitle })
    ).not.toBeInTheDocument()
  }
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
  if (expectedContent === null) {
    expect(card).toBeFalsy()
    return
  }
  expect(card).toBeTruthy()

  for (const [key, value] of Object.entries(expectedContent)) {
    const rows = card.querySelectorAll('.govuk-summary-list__row')
    const row = Array.from(rows).find((r) => {
      const keyElement = r.querySelector(GOV_UK_SUMMARY_LIST_KEY)
      return keyElement && keyElement.textContent.trim() === key
    })

    if (!row) {
      const availableKeys = Array.from(rows).map((r) => {
        const keyElement = r.querySelector(GOV_UK_SUMMARY_LIST_KEY)
        return keyElement ? keyElement.textContent.trim() : 'NO_KEY'
      })
      throw new Error(
        `Could not find row with key "${key}" in card "${cardSelector}". Available keys: ${availableKeys.join(', ')}`
      )
    }

    expect(row).toBeTruthy()
    const valueElement = row.querySelector('.govuk-summary-list__value')
    if (Array.isArray(value)) {
      for (const expectedValue of value) {
        expect(valueElement.textContent.trim()).toContain(expectedValue)
      }
    } else {
      expect(valueElement.textContent.trim()).toBe(value)
    }
  }
}

/**
 * Validates application details summary card
 * @param {Document} document - JSDOM document
 * @param {object} expected - Expected page content
 */
export const validateApplicationDetails = (document, expected) => {
  validateSummaryCardContent(
    document,
    '#application-details-card',
    expected.applicationDetails
  )
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

export const validateSiteLocation = (document, expected) => {
  if (expected.siteLocation) {
    validateSummaryCardContent(
      document,
      '#site-location-card',
      expected.siteLocation
    )
  }
}

/**
 * Validates activity details summary card
 * @param {Document} document - JSDOM document
 * @param {object} expected - Expected page content
 */
export const validateActivityDetails = (document, expected) => {
  if (expected.activityDetails) {
    validateSummaryCardContent(
      document,
      '#activity-details-card',
      expected.activityDetails
    )
  }
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
  const siteDetailsData = expectedPageContent.siteDetails
  const multipleSiteDetails =
    expectedPageContent.multipleSiteDetails?.multipleSitesEnabled

  if (multipleSiteDetails) {
    siteDetailsData.forEach((siteDetails, index) => {
      validateSummaryCardContent(
        document,
        `#site-details-${index + 1}`,
        siteDetails
      )
    })
  } else {
    const siteCard = document.querySelector('#site-details-1')
    expect(siteCard).toBeTruthy()

    // Validate basic site details if present
    if (siteDetailsData.length) {
      validateSummaryCardContent(
        document,
        '#site-details-1',
        siteDetailsData[0]
      )
    }

    // Validate extended site details (coordinate points) if present
    const coords =
      expectedPageContent.siteDetailsExtended?.coordinatePoints ?? []
    for (const point of coords) {
      expect(siteCard).toHaveTextContent(point)
    }
  }
}
