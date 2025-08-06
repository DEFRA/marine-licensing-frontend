import { getByText } from '@testing-library/dom'
import { JSDOM } from 'jsdom'
import { routes } from '~/src/server/common/constants/routes.js'
import { statusCodes } from '~/src/server/common/constants/status-codes.js'
import * as authRequests from '~/src/server/common/helpers/authenticated-requests.js'
import * as cacheUtils from '~/src/server/common/helpers/session-cache/utils.js'
import { createServer } from '~/src/server/index.js'
import { baseExemption } from './fixtures.js'

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

  const createFileUploadExemption = (fileUploadType, filename) => ({
    ...baseExemption,
    siteDetails: {
      ...baseExemption.siteDetails,
      fileUploadType,
      uploadedFile: { filename }
    }
  })

  const verifySiteDetailsCard = (document, fileType, filename) => {
    const { card, title } = getSummaryCard(document, '#site-details-card')
    expect(title.textContent.trim()).toBe('Site details')

    verifySummaryListRow(
      card,
      'Method of providing site location',
      'Upload a file with the coordinates of the site'
    )
    verifySummaryListRow(card, 'File type', fileType)

    if (filename) {
      verifySummaryListRow(card, 'File uploaded', filename)
    }

    return card
  }

  const testFileUploadDisplay = async (
    fileUploadType,
    filename,
    expectedDisplayType
  ) => {
    const exemption = createFileUploadExemption(fileUploadType, filename)
    jest.spyOn(cacheUtils, 'getExemptionCache').mockReturnValue(exemption)

    const { document } = await getCheckYourAnswersPage()
    verifySiteDetailsCard(document, expectedDisplayType, filename)
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
    jest.spyOn(cacheUtils, 'getExemptionCache').mockReturnValue(baseExemption)
    jest
      .spyOn(cacheUtils, 'setExemptionCache')
      .mockImplementation(() => undefined)
    jest.spyOn(authRequests, 'authenticatedGetRequest').mockResolvedValue({
      payload: { value: { taskList: { id: baseExemption.id } } }
    })
  })

  describe('AC1 - Site details card for uploaded site', () => {
    test('should display Shapefile upload details correctly', async () => {
      expect.hasAssertions()
      const { document } = await getCheckYourAnswersPage()
      verifySiteDetailsCard(
        document,
        'Shapefile',
        'Cavendish_Dock_Boundary_Polygon_WGS84.zip'
      )
    })

    test('should display KML upload details correctly', async () => {
      expect.hasAssertions()
      await testFileUploadDisplay('kml', 'hammersmith_coordinates.kml', 'KML')
    })

    test('should display zip filenames correctly', async () => {
      expect.hasAssertions()
      await testFileUploadDisplay(
        'shapefile',
        'marine_site_coordinates.zip',
        'Shapefile'
      )
    })

    test('should display exact file examples from user story', async () => {
      expect.hasAssertions()

      await testFileUploadDisplay('kml', 'coordinates.kml', 'KML')
      await testFileUploadDisplay(
        'shapefile',
        'Hammersmith_coordinates.zip',
        'Shapefile'
      )
    })

    test('should show fixed method text as specified in AC1', async () => {
      expect.hasAssertions()
      const { document } = await getCheckYourAnswersPage()

      const { card } = getSummaryCard(document, '#site-details-card')
      verifySummaryListRow(
        card,
        'Method of providing site location',
        'Upload a file with the coordinates of the site'
      )
    })
  })

  describe('Page structure and navigation', () => {
    test('should display correct page layout and navigation elements', async () => {
      const { document } = await getCheckYourAnswersPage()

      const heading = document.querySelector('#check-your-answers-heading')
      expect(heading).toBeTruthy()
      expect(heading.tagName).toBe('H2')
      expect(heading.classList.contains('govuk-heading-l')).toBe(true)
      expect(heading.textContent.trim()).toBe(
        'Check your answers before sending your information'
      )

      const projectCaption = document.querySelector('.govuk-caption-l')
      expect(projectCaption).toBeTruthy()
      expect(projectCaption.textContent.trim()).toBe(baseExemption.projectName)

      const backLink = document.querySelector('.govuk-back-link')
      expect(backLink).toBeTruthy()
      expect(backLink.textContent.trim()).toBe('Go back to your project')
    })

    test('should display all required summary cards from user story', async () => {
      const { document } = await getCheckYourAnswersPage()

      const requiredCards = [
        { id: '#project-details-card', title: 'Project details' },
        { id: '#activity-dates-card', title: 'Activity dates' },
        { id: '#activity-details-card', title: 'Activity details' },
        { id: '#site-details-card', title: 'Site details' },
        { id: '#public-register-card', title: 'Public register' }
      ]

      requiredCards.forEach(({ id, title }) => {
        const { title: cardTitle } = getSummaryCard(document, id)
        expect(cardTitle.textContent.trim()).toBe(title)
      })
    })

    test('should display submission section', async () => {
      const { document } = await getCheckYourAnswersPage()

      const submissionHeading = document.querySelector('h2.govuk-heading-m')
      expect(submissionHeading).toBeTruthy()
      expect(submissionHeading.textContent.trim()).toBe(
        'Now send your information'
      )

      const confirmButton = document.querySelector('#confirm-and-send')
      expect(confirmButton).toBeTruthy()
      expect(confirmButton.tagName).toBe('BUTTON')
      expect(confirmButton.classList.contains('govuk-button')).toBe(true)
      expect(confirmButton.textContent.trim()).toBe('Confirm and send')

      const form = document.querySelector('form[method="post"]')
      expect(form).toBeTruthy()

      const csrfToken = form.querySelector('input[name="csrfToken"]')
      expect(csrfToken).toBeTruthy()
    })

    test('should display GOV.UK page structure elements from user story', async () => {
      const { document } = await getCheckYourAnswersPage()

      const pageLayout = document.querySelector('.govuk-grid-row')
      expect(pageLayout).toBeTruthy()

      const mainColumn = document.querySelector('.govuk-grid-column-full')
      expect(mainColumn).toBeTruthy()
    })
  })

  describe('User Story ML-140 Complete AC1 Validation', () => {
    test('GIVEN I am viewing Check your answers page AND I have uploaded site details WHEN I view Site details card THEN I see all AC1 requirements', async () => {
      expect.hasAssertions()
      const { document } = await getCheckYourAnswersPage()

      const { card, title } = getSummaryCard(document, '#site-details-card')

      expect(title.textContent.trim()).toBe('Site details')

      verifySummaryListRow(
        card,
        'Method of providing site location',
        'Upload a file with the coordinates of the site'
      )

      verifySummaryListRow(card, 'File type', 'Shapefile')

      verifySummaryListRow(
        card,
        'File uploaded',
        'Cavendish_Dock_Boundary_Polygon_WGS84.zip'
      )

      const mapViewRow = getSummaryListRow(card, 'Map view')
      expect(mapViewRow).toBeFalsy()
    })
  })

  describe('Comprehensive validation of all user answers (Core ML-140 requirement)', () => {
    test('should display ALL user-provided answers correctly in their respective cards', async () => {
      expect.hasAssertions()
      const { document } = await getCheckYourAnswersPage()

      const { card: projectCard, title: projectTitle } = getSummaryCard(
        document,
        '#project-details-card'
      )
      expect(projectTitle.textContent.trim()).toBe('Project details')
      verifySummaryListRow(
        projectCard,
        'Project name',
        baseExemption.projectName
      )

      const { card: datesCard, title: datesTitle } = getSummaryCard(
        document,
        '#activity-dates-card'
      )
      expect(datesTitle.textContent.trim()).toBe('Activity dates')
      verifySummaryListRow(datesCard, 'Start date', '1 July 2025')
      verifySummaryListRow(datesCard, 'End date', '7 July 2025')

      const { card: activityCard, title: activityTitle } = getSummaryCard(
        document,
        '#activity-details-card'
      )
      expect(activityTitle.textContent.trim()).toBe('Activity details')
      const activityDescRow = getSummaryListRow(
        activityCard,
        'Activity description'
      )
      expect(activityDescRow).toBeTruthy()

      verifySiteDetailsCard(
        document,
        'Shapefile',
        'Cavendish_Dock_Boundary_Polygon_WGS84.zip'
      )

      const { title: publicTitle } = getSummaryCard(
        document,
        '#public-register-card'
      )
      expect(publicTitle.textContent.trim()).toBe('Public register')
    })

    test('should display activity dates in correct format', async () => {
      const { document } = await getCheckYourAnswersPage()

      expect(getByText(document, '1 July 2025')).toBeInTheDocument()
      expect(getByText(document, '7 July 2025')).toBeInTheDocument()
    })

    test('should display activity description content correctly in activity details card', async () => {
      expect.hasAssertions()
      const { document } = await getCheckYourAnswersPage()

      const { card: activityCard, title: activityTitle } = getSummaryCard(
        document,
        '#activity-details-card'
      )
      expect(activityTitle.textContent.trim()).toBe('Activity details')

      const activityDescRow = getSummaryListRow(
        activityCard,
        'Activity description'
      )
      expect(activityDescRow).toBeTruthy()

      const key = activityDescRow.querySelector('.govuk-summary-list__key')
      expect(key.textContent.trim()).toBe('Activity description')
    })

    test('should handle public register information in correct card', async () => {
      expect.hasAssertions()
      const { document } = await getCheckYourAnswersPage()

      const { card: publicCard, title: publicTitle } = getSummaryCard(
        document,
        '#public-register-card'
      )
      expect(publicTitle.textContent.trim()).toBe('Public register')

      const infoRow = getSummaryListRow(
        publicCard,
        'Information withheld from public register'
      )
      expect(infoRow).toBeTruthy()
    })
  })

  describe('Edge cases and error handling', () => {
    test('should handle missing filename gracefully', async () => {
      expect.hasAssertions()
      const invalidExemption = createFileUploadExemption('shapefile', undefined)
      jest
        .spyOn(cacheUtils, 'getExemptionCache')
        .mockReturnValue(invalidExemption)

      const { document } = await getCheckYourAnswersPage()

      verifySiteDetailsCard(document, 'Shapefile', null)
    })
  })
})
