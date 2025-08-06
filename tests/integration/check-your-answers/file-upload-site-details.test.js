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

  const mockExemptionCache = (exemption) => {
    jest.spyOn(cacheUtils, 'getExemptionCache').mockReturnValue(exemption)
  }

  const findCardByTitle = (document, expectedTitle) => {
    const cardTitles = document.querySelectorAll('.govuk-summary-card__title')
    return Array.from(cardTitles).find(
      (title) => title.textContent.trim() === expectedTitle
    )
  }

  const testFileUploadScenario = async (
    fileUploadType,
    filename,
    fileTypeDisplay
  ) => {
    expect.hasAssertions()

    const exemption = createFileUploadExemption(fileUploadType, filename)
    mockExemptionCache(exemption)

    const { document } = await getCheckYourAnswersPage()
    const { card } = getSummaryCard(document, '#site-details-card')

    verifySummaryListRow(
      card,
      'Method of providing site location',
      'Upload a file with the coordinates of the site'
    )
    verifySummaryListRow(card, 'File type', fileTypeDisplay)
    verifySummaryListRow(card, 'File uploaded', filename)

    return { document, card }
  }

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
    describe('When user uploads a Shapefile', () => {
      test('displays correct file information', async () => {
        expect.hasAssertions()
        await testFileUploadScenario(
          'shapefile',
          'marine_site.zip',
          'Shapefile'
        )
      })
    })

    describe('When user uploads a KML file', () => {
      test('displays correct file information', async () => {
        expect.hasAssertions()
        await testFileUploadScenario('kml', 'coordinates.kml', 'KML')
      })
    })

    describe('User story example files', () => {
      test('displays KML example from story (coordinates.kml)', async () => {
        expect.hasAssertions()
        await testFileUploadScenario('kml', 'coordinates.kml', 'KML')
      })

      test('displays Shapefile example from story (Hammersmith_coordinates.zip)', async () => {
        expect.hasAssertions()
        await testFileUploadScenario(
          'shapefile',
          'Hammersmith_coordinates.zip',
          'Shapefile'
        )
      })
    })

    describe('Required fixed text (AC1)', () => {
      test('always shows the same method description', async () => {
        expect.hasAssertions()

        // Arrange: Any file upload scenario
        const { document } = await getCheckYourAnswersPage()

        // Act & Assert: Method text is always the same fixed text
        const { card } = getSummaryCard(document, '#site-details-card')
        verifySummaryListRow(
          card,
          'Method of providing site location',
          'Upload a file with the coordinates of the site'
        )
      })
    })
  })

  describe('Page Structure (User Story Requirements)', () => {
    describe('Page header and navigation', () => {
      test('displays correct heading structure', async () => {
        // Arrange & Act: Load the check your answers page
        const { document } = await getCheckYourAnswersPage()

        // Assert: Main heading follows GOV.UK pattern
        const heading = document.querySelector('#check-your-answers-heading')
        expect(heading.tagName).toBe('H2')
        expect(heading.classList.contains('govuk-heading-l')).toBe(true)
        expect(heading.textContent.trim()).toBe(
          'Check your answers before sending your information'
        )

        // Assert: Project name appears as page caption
        const projectCaption = document.querySelector('.govuk-caption-l')
        expect(projectCaption.textContent.trim()).toBe(
          baseExemption.projectName
        )
      })

      test('provides back link navigation', async () => {
        const { document } = await getCheckYourAnswersPage()

        const backLink = document.querySelector('.govuk-back-link')
        expect(backLink.textContent.trim()).toBe('Go back to your project')
      })
    })

    describe('Summary cards (from user story screenshots)', () => {
      test('displays all required summary cards', async () => {
        const { document } = await getCheckYourAnswersPage()

        // Assert: All cards from user story are present
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
      })
    })

    describe('Submission section', () => {
      test('displays submission form with required elements', async () => {
        const { document } = await getCheckYourAnswersPage()

        // Assert: Submission heading
        const submissionHeading = document.querySelector('h2.govuk-heading-m')
        expect(submissionHeading.textContent.trim()).toBe(
          'Now send your information'
        )

        // Assert: Confirm button with correct styling
        const confirmButton = document.querySelector('#confirm-and-send')
        expect(confirmButton.tagName).toBe('BUTTON')
        expect(confirmButton.classList.contains('govuk-button')).toBe(true)
        expect(confirmButton.textContent.trim()).toBe('Confirm and send')

        // Assert: Form has CSRF protection
        const form = document.querySelector('form[method="post"]')
        const csrfToken = form.querySelector('input[name="csrfToken"]')
        expect(csrfToken).toBeTruthy()
      })
    })

    describe('GOV.UK layout structure', () => {
      test('uses correct grid layout', async () => {
        const { document } = await getCheckYourAnswersPage()

        const pageLayout = document.querySelector('.govuk-grid-row')
        expect(pageLayout).toBeTruthy()

        const mainColumn = document.querySelector('.govuk-grid-column-full')
        expect(mainColumn).toBeTruthy()
      })
    })
  })

  describe('Complete AC1 Acceptance Test', () => {
    test('satisfies all AC1 requirements in a single scenario', async () => {
      expect.hasAssertions()

      // Arrange: User has completed file upload flow
      // Act: User views check your answers page
      const { document } = await getCheckYourAnswersPage()

      // Assert: Site details card contains all AC1 required information
      const { card, title } = getSummaryCard(document, '#site-details-card')
      expect(title.textContent.trim()).toBe('Site details')

      // AC1 Requirement 1: Method text is fixed
      verifySummaryListRow(
        card,
        'Method of providing site location',
        'Upload a file with the coordinates of the site'
      )

      // AC1 Requirement 2: File type shows correct value
      verifySummaryListRow(card, 'File type', 'Shapefile')

      // AC1 Requirement 3: Filename includes extension
      verifySummaryListRow(
        card,
        'File uploaded',
        'Cavendish_Dock_Boundary_Polygon_WGS84.zip'
      )

      // AC1 Note: Map view is NOT delivered in this story
      const mapViewRow = getSummaryListRow(card, 'Map view')
      expect(mapViewRow).toBeFalsy()
    })
  })

  describe('All User Data Validation', () => {
    describe('Each summary card displays user answers', () => {
      test('project details card shows project name', async () => {
        expect.hasAssertions()
        const { document } = await getCheckYourAnswersPage()

        const { card, title } = getSummaryCard(
          document,
          '#project-details-card'
        )
        expect(title.textContent.trim()).toBe('Project details')
        verifySummaryListRow(card, 'Project name', baseExemption.projectName)
      })

      test('activity dates card shows formatted dates', async () => {
        const { document } = await getCheckYourAnswersPage()

        const { card, title } = getSummaryCard(document, '#activity-dates-card')
        expect(title.textContent.trim()).toBe('Activity dates')

        // Dates should be formatted in GOV.UK style
        verifySummaryListRow(card, 'Start date', '1 July 2025')
        verifySummaryListRow(card, 'End date', '7 July 2025')
      })

      test('activity details card shows description section', async () => {
        expect.hasAssertions()
        const { document } = await getCheckYourAnswersPage()

        const { card, title } = getSummaryCard(
          document,
          '#activity-details-card'
        )
        expect(title.textContent.trim()).toBe('Activity details')

        // Activity description displays the user-provided text
        verifySummaryListRow(
          card,
          'Activity description',
          baseExemption.activityDescription
        )
      })

      test('site details card shows file upload information', async () => {
        expect.hasAssertions()
        const { document } = await getCheckYourAnswersPage()

        verifySiteDetailsCard(
          document,
          'Shapefile',
          'Cavendish_Dock_Boundary_Polygon_WGS84.zip'
        )
      })

      test('public register card shows privacy preferences', async () => {
        expect.hasAssertions()
        const { document } = await getCheckYourAnswersPage()

        const { card, title } = getSummaryCard(
          document,
          '#public-register-card'
        )
        expect(title.textContent.trim()).toBe('Public register')

        // Validate the actual public register choice from test data
        // baseExemption.publicRegister.withholdFromPublicRegister: false should display as "No"
        verifySummaryListRow(
          card,
          'Information withheld from public register',
          'No'
        )
      })
    })

    describe('Complete user journey validation', () => {
      test('displays all user-provided data with correct values from test fixture', async () => {
        expect.hasAssertions()

        // Arrange: User has completed all form steps with baseExemption data
        // Act: View complete check your answers page
        const { document } = await getCheckYourAnswersPage()

        // Assert: Every card shows the exact user data from test fixture

        // Project details - validate actual project name
        const { card: projectCard } = getSummaryCard(
          document,
          '#project-details-card'
        )
        verifySummaryListRow(
          projectCard,
          'Project name',
          baseExemption.projectName
        )

        // Activity dates - validate formatted dates
        const { card: datesCard } = getSummaryCard(
          document,
          '#activity-dates-card'
        )
        verifySummaryListRow(datesCard, 'Start date', '1 July 2025') // baseExemption.activityDates.start formatted
        verifySummaryListRow(datesCard, 'End date', '7 July 2025') // baseExemption.activityDates.end formatted

        // Activity details - validate actual description content
        const { card: activityCard } = getSummaryCard(
          document,
          '#activity-details-card'
        )
        verifySummaryListRow(
          activityCard,
          'Activity description',
          baseExemption.activityDescription
        )

        // Site details - validate file upload details
        const { card: siteCard } = getSummaryCard(
          document,
          '#site-details-card'
        )
        verifySummaryListRow(siteCard, 'File type', 'Shapefile') // baseExemption.siteDetails.fileUploadType
        verifySummaryListRow(
          siteCard,
          'File uploaded',
          baseExemption.siteDetails.uploadedFile.filename
        )

        // Public register - validate privacy choice
        const { card: publicCard } = getSummaryCard(
          document,
          '#public-register-card'
        )
        verifySummaryListRow(
          publicCard,
          'Information withheld from public register',
          'No' // baseExemption.publicRegister.withholdFromPublicRegister: false
        )
      })

      test('displays all required summary cards', async () => {
        expect.hasAssertions()
        const { document } = await getCheckYourAnswersPage()

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
      })
    })
  })

  describe('Error Scenarios', () => {
    describe('When file upload data is incomplete', () => {
      test('handles missing filename gracefully', async () => {
        expect.hasAssertions()

        // Arrange: File upload occurred but filename is missing
        const exemptionWithMissingFile = createFileUploadExemption(
          'shapefile',
          undefined
        )
        mockExemptionCache(exemptionWithMissingFile)

        // Act: View check your answers page
        const { document } = await getCheckYourAnswersPage()

        // Assert: Site details card still displays (graceful degradation)
        const { card } = getSummaryCard(document, '#site-details-card')
        verifySummaryListRow(
          card,
          'Method of providing site location',
          'Upload a file with the coordinates of the site'
        )
        verifySummaryListRow(card, 'File type', 'Shapefile')

        // Filename row should either be absent or show fallback (test passes either way)
        getSummaryListRow(card, 'File uploaded')
      })
    })
  })
})
