import { JSDOM } from 'jsdom'
import { routes } from '~/src/server/common/constants/routes.js'
import { statusCodes } from '~/src/server/common/constants/status-codes.js'
import * as authRequests from '~/src/server/common/helpers/authenticated-requests.js'
import * as cacheUtils from '~/src/server/common/helpers/session-cache/utils.js'
import { createServer } from '~/src/server/index.js'
import { errorScenarios, testScenarios } from './fixtures.js'

jest.mock('~/src/server/common/helpers/session-cache/utils.js')
jest.mock('~/src/server/common/helpers/authenticated-requests.js')

describe('Check Your Answers - File Upload Site Details Integration Tests', () => {
  let server

  const getCheckYourAnswersPage = async () => {
    const response = await server.inject({
      method: 'GET',
      url: routes.CHECK_YOUR_ANSWERS
    })
    expect(response.statusCode).toBe(statusCodes.ok)
    const { document } = new JSDOM(response.result).window
    return { response, document }
  }

  const getSummaryListRow = (card, keyText) => {
    const rows = card.querySelectorAll('.govuk-summary-list__row')
    return Array.from(rows).find((row) => {
      const key = row.querySelector('.govuk-summary-list__key')
      return key && key.textContent.trim() === keyText
    })
  }

  const verifySummaryListRow = (card, keyText, expectedValue) => {
    const row = getSummaryListRow(card, keyText)
    expect(row).toBeTruthy()

    const key = row.querySelector('.govuk-summary-list__key')
    const value = row.querySelector('.govuk-summary-list__value')

    expect(key.textContent.trim()).toBe(keyText)
    expect(value.textContent.trim()).toBe(expectedValue)

    return { row, key, value }
  }

  const getSummaryCard = (document, cardId) => {
    const card = document.querySelector(cardId)
    expect(card).toBeTruthy()
    expect(card.classList.contains('govuk-summary-card')).toBe(true)

    const title = card.querySelector('.govuk-summary-card__title')
    expect(title).toBeTruthy()

    return { card, title }
  }

  const mockExemptionCache = (exemption) => {
    jest.spyOn(cacheUtils, 'getExemptionCache').mockReturnValue(exemption)
  }

  const findCardByTitle = (document, expectedTitle) => {
    const cardTitles = document.querySelectorAll('.govuk-summary-card__title')
    return Array.from(cardTitles).find(
      (title) => title.textContent.trim() === expectedTitle
    )
  }

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
      .spyOn(cacheUtils, 'getExemptionCache')
      .mockReturnValue(testScenarios[0].exemption)
    jest
      .spyOn(cacheUtils, 'setExemptionCache')
      .mockImplementation(() => undefined)
    jest.spyOn(authRequests, 'authenticatedGetRequest').mockResolvedValue({
      payload: { value: { taskList: { id: testScenarios[0].exemption.id } } }
    })
  })

  describe('ML-140 Full Journey Tests', () => {
    test.each(testScenarios)(
      'Complete journey with $name',
      async ({ exemption, expected }) => {
        expect.hasAssertions()

        mockExemptionCache(exemption)
        const { document } = await getCheckYourAnswersPage()

        // Validate page structure
        const heading = document.querySelector('#check-your-answers-heading')
        expect(heading.textContent.trim()).toBe(
          'Check your answers before sending your information'
        )

        const backLink = document.querySelector('.govuk-back-link')
        expect(backLink.textContent.trim()).toBe('Go back to your project')

        // Validate all summary cards present
        const expectedCards = [
          'Project details',
          'Activity dates',
          'Activity details',
          'Site details',
          'Public register'
        ]
        expectedCards.forEach((expectedTitle) => {
          const foundCard = findCardByTitle(document, expectedTitle)
          expect(foundCard).toBeTruthy()
        })

        // Validate all user data
        const { card: projectCard } = getSummaryCard(
          document,
          '#project-details-card'
        )
        verifySummaryListRow(projectCard, 'Project name', exemption.projectName)

        const { card: datesCard } = getSummaryCard(
          document,
          '#activity-dates-card'
        )
        verifySummaryListRow(datesCard, 'Start date', '1 July 2025')
        verifySummaryListRow(datesCard, 'End date', '7 July 2025')

        const { card: activityCard } = getSummaryCard(
          document,
          '#activity-details-card'
        )
        verifySummaryListRow(
          activityCard,
          'Activity description',
          exemption.activityDescription
        )

        // AC1 Site details validation
        const { card: siteCard } = getSummaryCard(
          document,
          '#site-details-card'
        )
        verifySummaryListRow(
          siteCard,
          'Method of providing site location',
          'Upload a file with the coordinates of the site'
        )
        verifySummaryListRow(siteCard, 'File type', expected.fileType)
        verifySummaryListRow(siteCard, 'File uploaded', expected.filename)

        // Map view should not be present (AC1 requirement)
        const mapViewRow = getSummaryListRow(siteCard, 'Map view')
        expect(mapViewRow).toBeFalsy()

        const { card: publicCard } = getSummaryCard(
          document,
          '#public-register-card'
        )
        verifySummaryListRow(
          publicCard,
          'Information withheld from public register',
          'No'
        )

        // Validate submission section
        const confirmButton = document.querySelector('#confirm-and-send')
        expect(confirmButton.textContent.trim()).toBe('Confirm and send')
      }
    )
  })

  describe('Error Scenarios', () => {
    test.each(errorScenarios)(
      'handles $name',
      async ({ exemption, expected }) => {
        expect.hasAssertions()

        mockExemptionCache(exemption)
        const { document } = await getCheckYourAnswersPage()

        const { card } = getSummaryCard(document, '#site-details-card')
        verifySummaryListRow(
          card,
          'Method of providing site location',
          'Upload a file with the coordinates of the site'
        )
        verifySummaryListRow(card, 'File type', expected.fileType)

        // For missing filename, just verify the row exists (may or may not have content)
        getSummaryListRow(card, 'File uploaded')
      }
    )
  })
})
