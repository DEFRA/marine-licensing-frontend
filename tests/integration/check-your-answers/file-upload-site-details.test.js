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

  const verifyCardContent = (document, cardId, expectedTexts) => {
    const card = document.querySelector(cardId)
    expect(card).toBeTruthy()
    expectedTexts.forEach((text) => {
      expect(card.textContent).toContain(text)
    })
    return card
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
    const commonTexts = [
      'Site details',
      'Method of providing site location',
      'Upload a file with the coordinates of the site',
      'File type',
      fileType
    ]
    if (filename) {
      commonTexts.push('File uploaded', filename)
    }
    return verifyCardContent(document, '#site-details-card', commonTexts)
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
  })

  describe('Page structure and navigation', () => {
    test('should display correct page layout and navigation elements', async () => {
      const { document } = await getCheckYourAnswersPage()

      expect(
        getByText(
          document,
          'Check your answers before sending your information'
        )
      ).toBeInTheDocument()

      const projectNameElements = document.querySelectorAll('*')
      const projectNameTexts = Array.from(projectNameElements).filter(
        (el) =>
          el.textContent && el.textContent.trim() === baseExemption.projectName
      )
      expect(projectNameTexts.length).toBeGreaterThanOrEqual(1)

      expect(getByText(document, 'Go back to your project')).toBeInTheDocument()
    })

    test('should display all required summary cards from user story', async () => {
      const { document } = await getCheckYourAnswersPage()

      expect(getByText(document, 'Project details')).toBeInTheDocument()
      expect(getByText(document, 'Project name')).toBeInTheDocument()
      expect(getByText(document, 'Activity dates')).toBeInTheDocument()
      expect(getByText(document, 'Start date')).toBeInTheDocument()
      expect(getByText(document, 'End date')).toBeInTheDocument()
      expect(getByText(document, 'Activity details')).toBeInTheDocument()
      expect(getByText(document, 'Site details')).toBeInTheDocument()
      expect(getByText(document, 'Public register')).toBeInTheDocument()
    })

    test('should display submission section', async () => {
      const { document } = await getCheckYourAnswersPage()

      expect(
        getByText(document, 'Now send your information')
      ).toBeInTheDocument()

      const submitButtons = document.querySelectorAll(
        'button[type="submit"], input[type="submit"]'
      )
      expect(submitButtons.length).toBeGreaterThan(0)
    })
  })

  describe('Comprehensive validation of all user answers (Core ML-140 requirement)', () => {
    test('should display ALL user-provided answers correctly in their respective cards', async () => {
      expect.hasAssertions()
      const { document } = await getCheckYourAnswersPage()

      verifyCardContent(document, '#project-details-card', [
        'Project details',
        'Project name',
        baseExemption.projectName
      ])

      verifyCardContent(document, '#activity-dates-card', [
        'Activity dates',
        'Start date',
        '1 July 2025',
        'End date',
        '7 July 2025'
      ])

      verifyCardContent(document, '#activity-details-card', [
        'Activity details',
        'Activity description'
      ])

      verifySiteDetailsCard(
        document,
        'Shapefile',
        'Cavendish_Dock_Boundary_Polygon_WGS84.zip'
      )

      verifyCardContent(document, '#public-register-card', ['Public register'])
    })

    test('should display activity dates in correct format', async () => {
      const { document } = await getCheckYourAnswersPage()

      expect(getByText(document, '1 July 2025')).toBeInTheDocument()
      expect(getByText(document, '7 July 2025')).toBeInTheDocument()
    })

    test('should display activity description content correctly in activity details card', async () => {
      expect.hasAssertions()
      const { document } = await getCheckYourAnswersPage()

      verifyCardContent(document, '#activity-details-card', [
        'Activity details',
        'Activity description'
      ])
    })

    test('should handle public register information in correct card', async () => {
      expect.hasAssertions()
      const { document } = await getCheckYourAnswersPage()

      verifyCardContent(document, '#public-register-card', ['Public register'])
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
