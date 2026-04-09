import { JSDOM } from 'jsdom'
import { marineLicenceRoutes } from '~/src/server/common/constants/routes.js'
import { statusCodes } from '~/src/server/common/constants/status-codes.js'
import { testScenarios } from './marine-licence-fixtures/file-upload-fixtures.js'
import {
  getRowByKey,
  validateActionLink,
  validateIncompleteWarning,
  validateNavigationElements,
  validatePageStructure
} from './review-site-details-utils.js'
import {
  mockMarineLicence,
  setupTestServer
} from '~/tests/integration/shared/test-setup-helpers.js'
import {
  makeGetRequest,
  makePostRequest
} from '~/src/server/test-helpers/server-requests.js'
import * as marineLicenceService from '~/src/services/marine-licence-service/index.js'

vi.mock('~/src/services/marine-licence-service/index.js')

describe('ML Review Site Details - File Upload Integration Tests', () => {
  const getServer = setupTestServer()

  beforeEach(() => {
    mockMarineLicence(testScenarios[0].marineLicence)
    vi.mocked(marineLicenceService.getMarineLicenceService).mockReturnValue({
      getMarineLicenceById: vi
        .fn()
        .mockResolvedValue(testScenarios[0].marineLicence)
    })
  })

  test.each(testScenarios)(
    '$name - validates file upload display',
    async ({ marineLicence, expectedPageContent }) => {
      expect.hasAssertions()

      const document = await getPageDocument(marineLicence)

      validatePageStructure(document, expectedPageContent)
      validateSiteLocationCard(document)
      validateIncompleteWarning(document, expectedPageContent)
      validateNavigationElements(document)

      for (const site of expectedPageContent.siteDetails.keys()) {
        validateFileUpload(document, expectedPageContent, site)
      }
    }
  )

  describe('back link', () => {
    test('should point to check your answers when from=check-your-answers', async () => {
      const response = await makeGetRequest({
        server: getServer(),
        url: `${marineLicenceRoutes.MARINE_LICENCE_REVIEW_SITE_DETAILS}?from=check-your-answers`
      })

      expect(response.statusCode).toBe(statusCodes.ok)
      const document = new JSDOM(response.result).window.document

      const backLink = document.querySelector('.govuk-back-link')
      expect(backLink.getAttribute('href')).toBe(
        marineLicenceRoutes.MARINE_LICENCE_CHECK_YOUR_ANSWERS
      )
    })
  })

  test('should redirect to task list when no marine licence id in cache', async () => {
    mockMarineLicence({})

    const response = await makeGetRequest({
      server: getServer(),
      url: marineLicenceRoutes.MARINE_LICENCE_REVIEW_SITE_DETAILS
    })

    expect(response.statusCode).toBe(statusCodes.redirect)
    expect(response.headers.location).toBe(
      marineLicenceRoutes.MARINE_LICENCE_TASK_LIST
    )
  })

  test('should redirect to task list when coordinatesType is not file', async () => {
    const nonFileLicence = {
      ...testScenarios[0].marineLicence,
      siteDetails: [
        {
          ...testScenarios[0].marineLicence.siteDetails[0],
          coordinatesType: 'manual'
        }
      ]
    }
    mockMarineLicence(nonFileLicence)
    vi.mocked(marineLicenceService.getMarineLicenceService).mockReturnValue({
      getMarineLicenceById: vi.fn().mockResolvedValue(nonFileLicence)
    })

    const response = await makeGetRequest({
      server: getServer(),
      url: marineLicenceRoutes.MARINE_LICENCE_REVIEW_SITE_DETAILS
    })

    expect(response.statusCode).toBe(statusCodes.redirect)
    expect(response.headers.location).toBe(
      marineLicenceRoutes.MARINE_LICENCE_TASK_LIST
    )
  })

  describe('Form Submission', () => {
    test('should redirect to task list on form submission', async () => {
      mockMarineLicence(testScenarios[0].marineLicence)

      const response = await makePostRequest({
        url: marineLicenceRoutes.MARINE_LICENCE_REVIEW_SITE_DETAILS,
        server: getServer(),
        formData: {}
      })

      expect(response.statusCode).toBe(statusCodes.redirect)
      expect(response.headers.location).toBe(
        marineLicenceRoutes.MARINE_LICENCE_TASK_LIST
      )
    })
  })

  const getPageDocument = async (marineLicence) => {
    mockMarineLicence(marineLicence)
    vi.mocked(marineLicenceService.getMarineLicenceService).mockReturnValue({
      getMarineLicenceById: vi.fn().mockResolvedValue(marineLicence)
    })

    const response = await makeGetRequest({
      server: getServer(),
      url: marineLicenceRoutes.MARINE_LICENCE_REVIEW_SITE_DETAILS
    })

    expect(response.statusCode).toBe(statusCodes.ok)
    return new JSDOM(response.result).window.document
  }

  const validateSiteLocationCard = (document) => {
    const card = document.querySelector('#site-location-card')
    expect(card).toBeTruthy()

    const cardTitle = card.querySelector('.govuk-summary-card__title')
    expect(cardTitle.textContent.trim()).toBe('Providing the site location')

    const methodRow = getRowByKey(card, 'Method of providing site location')
    expect(methodRow).toBeTruthy()
    expect(methodRow.textContent).toContain('File uploaded')

    expect(getRowByKey(card, 'File type')).toBeFalsy()
    expect(getRowByKey(card, 'File uploaded')).toBeFalsy()
    expect(document.querySelector('[href*="delete"]')).toBeFalsy()
  }

  const validateFileUpload = (document, expected, siteIndex) => {
    const cards = document.querySelectorAll('.govuk-summary-card')
    const siteDetailsCards = Array.from(cards).filter((card) =>
      card.textContent.match(/Site/g)
    )

    siteDetailsCards.forEach((card, i) => {
      const siteNameRow = getRowByKey(card, 'Site name')

      const siteNameExpected = expected.siteDetails[siteIndex].siteName

      const hasValue =
        siteNameExpected &&
        siteNameExpected !== '' &&
        siteNameExpected !== 'Incomplete'

      const expectedText = hasValue ? siteNameExpected : 'Incomplete'

      expect(siteNameRow.textContent).toContain(expectedText)

      validateActionLink(siteNameRow, siteNameExpected, siteIndex)

      const mapViewRow = getRowByKey(card, 'Map view')
      expect(mapViewRow).toBeTruthy()
      expect(mapViewRow.textContent.trim()).toBe('Map view')

      const mapDiv = mapViewRow.querySelector(
        '.app-site-details-map[data-module="site-details-map"]'
      )
      expect(mapDiv).toBeTruthy()
    })
  }
})
