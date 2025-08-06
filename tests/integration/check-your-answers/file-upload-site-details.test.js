import { JSDOM } from 'jsdom'
import { routes } from '~/src/server/common/constants/routes.js'
import { statusCodes } from '~/src/server/common/constants/status-codes.js'
import * as authRequests from '~/src/server/common/helpers/authenticated-requests.js'
import * as cacheUtils from '~/src/server/common/helpers/session-cache/utils.js'
import { createServer } from '~/src/server/index.js'
import { testScenarios } from './fixtures.js'

jest.mock('~/src/server/common/helpers/session-cache/utils.js')
jest.mock('~/src/server/common/helpers/authenticated-requests.js')

describe('Check Your Answers - File Upload Site Details', () => {
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
    jest
      .spyOn(cacheUtils, 'setExemptionCache')
      .mockImplementation(() => undefined)
  })

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
      validateSubmissionSection(document, expectedPageContent)
    }
  )

  const getPageDocument = async (exemption) => {
    jest.spyOn(cacheUtils, 'getExemptionCache').mockReturnValue(exemption)
    jest.spyOn(authRequests, 'authenticatedGetRequest').mockResolvedValue({
      payload: { value: { taskList: { id: exemption.id } } }
    })

    const response = await server.inject({
      method: 'GET',
      url: routes.CHECK_YOUR_ANSWERS
    })

    expect(response.statusCode).toBe(statusCodes.ok)
    return new JSDOM(response.result).window.document
  }

  const validatePageStructure = (document, expected) => {
    const heading = document.querySelector('#check-your-answers-heading')
    expect(heading.textContent.trim()).toBe(expected.pageTitle)

    const backLink = document.querySelector('.govuk-back-link')
    expect(backLink.textContent.trim()).toBe(expected.backLinkText)
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

  const validateSiteDetails = (document, expected) => {
    validateSummaryCardContent(
      document,
      '#site-details-card',
      expected.siteDetails
    )

    if (expected.shouldNotHaveMapView) {
      const siteCard = document.querySelector('#site-details-card')
      const rows = siteCard.querySelectorAll('.govuk-summary-list__row')
      const mapViewRow = Array.from(rows).find((row) => {
        const keyElement = row.querySelector('.govuk-summary-list__key')
        return keyElement && keyElement.textContent.trim() === 'Map view'
      })
      expect(mapViewRow).toBeFalsy()
    }
  }

  const validatePublicRegister = (document, expected) => {
    validateSummaryCardContent(
      document,
      '#public-register-card',
      expected.publicRegister
    )
  }

  const validateSubmissionSection = (document, expected) => {
    const confirmButton = document.querySelector('#confirm-and-send')
    expect(confirmButton.textContent.trim()).toBe(expected.submitButton)
  }
})
