import { getByRole, getByText } from '@testing-library/dom'
import { JSDOM } from 'jsdom'
import * as authRequests from '~/src/server/common/helpers/authenticated-requests.js'
import { createServer } from '~/src/server/index.js'
import { testScenarios } from './fixtures.js'

jest.mock('~/src/server/common/helpers/authenticated-requests.js')

describe('View Details - Content Verification Integration Tests', () => {
  let server

  beforeAll(async () => {
    server = await createServer()
    await server.initialize()
  })

  afterAll(async () => {
    await server.stop()
  })

  beforeEach(() => {
    jest.resetAllMocks()
  })

  const validatePageStructure = (document, expected) => {
    const heading = getByRole(document, 'heading', { level: 1 })
    expect(heading).toHaveTextContent(expected.pageTitle)

    const caption = document.querySelector('.govuk-caption-l')
    expect(caption).toHaveTextContent(expected.pageCaption)

    const backLink = getByRole(document, 'link', {
      name: expected.backLinkText
    })
    expect(backLink).toHaveAttribute('href', expected.backLinkHref)
  }

  const validateAllSummaryCardsExist = (document, expected) => {
    expected.summaryCards.forEach((expectedTitle) => {
      const cardTitles = document.querySelectorAll('.govuk-summary-card__title')
      const foundCard = Array.from(cardTitles).find(
        (title) => title.textContent.trim() === expectedTitle
      )
      expect(foundCard).toBeTruthy()
    })
  }

  const validateSummaryCardContent = (
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

  const validateProjectDetails = (document, expected) => {
    validateSummaryCardContent(
      document,
      '#project-details-card',
      expected.projectDetails
    )
  }

  const validateActivityDates = (document, expected) => {
    validateSummaryCardContent(
      document,
      '#activity-dates-card',
      expected.activityDates
    )
  }

  const validateActivityDetails = (document, expected) => {
    validateSummaryCardContent(
      document,
      '#activity-details-card',
      expected.activityDetails
    )
  }

  const validatePublicRegister = (document, expected) => {
    validateSummaryCardContent(
      document,
      '#public-register-card',
      expected.publicRegister
    )
  }

  const validateSiteDetails = (document, expectedPageContent) => {
    const siteCard = document.querySelector('#site-details-card')
    expect(siteCard).toBeTruthy()

    if (expectedPageContent.siteDetails) {
      Object.entries(expectedPageContent.siteDetails).forEach(
        ([key, value]) => {
          const rows = siteCard.querySelectorAll('.govuk-summary-list__row')
          const row = Array.from(rows).find((row) => {
            const keyElement = row.querySelector('.govuk-summary-list__key')
            return keyElement && keyElement.textContent.trim() === key
          })
          expect(row).toBeTruthy()
          const valueElement = row.querySelector('.govuk-summary-list__value')
          expect(valueElement.textContent.trim()).toBe(value)
        }
      )
    }

    if (expectedPageContent.siteDetailsExtended?.coordinatePoints) {
      expectedPageContent.siteDetailsExtended.coordinatePoints.forEach(
        (point) => {
          const pointText = getByText(siteCard, point, { exact: false })
          expect(pointText).toBeInTheDocument()
        }
      )
    }
  }

  const validateReadOnlyBehavior = (document) => {
    // Verify no "Change" links are present (read-only mode)
    const changeLinks = document.querySelectorAll('a[href*="change"]')
    expect(changeLinks).toHaveLength(0)

    // Verify no submit button is present
    const submitButton = document.querySelector('button[type="submit"]')
    expect(submitButton).toBeNull()
  }

  const getPageDocument = async (exemption) => {
    jest.spyOn(authRequests, 'authenticatedGetRequest').mockResolvedValue({
      payload: { value: exemption }
    })

    const response = await server.inject({
      method: 'GET',
      url: `/exemption/view-details/${exemption.id}`
    })

    expect(response.statusCode).toBe(200)
    const { document } = new JSDOM(response.result).window
    return document
  }

  test.each(testScenarios)(
    '$name - validates every element on the page',
    async ({ exemption, expectedPageContent }) => {
      expect.hasAssertions()

      const document = await getPageDocument(exemption)

      validatePageStructure(document, expectedPageContent)
      validateAllSummaryCardsExist(document, expectedPageContent)
      validateProjectDetails(document, expectedPageContent)
      validateActivityDates(document, expectedPageContent)
      validateActivityDetails(document, expectedPageContent)
      validateSiteDetails(document, expectedPageContent)
      validatePublicRegister(document, expectedPageContent)
      validateReadOnlyBehavior(document)
    }
  )
})
