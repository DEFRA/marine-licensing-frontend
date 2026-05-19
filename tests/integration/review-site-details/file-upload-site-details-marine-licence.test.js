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
import { expectedValueOrIncomplete } from '~/tests/integration/shared/expect-utils.js'
import {
  makeGetRequest,
  makePostRequest
} from '~/src/server/test-helpers/server-requests.js'
import * as marineLicenceService from '~/src/services/marine-licence-service/index.js'
import { getByRole, within } from '@testing-library/dom'

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

    test('should redirect back to review page with anchor when addActivity is submitted', async () => {
      mockMarineLicence(testScenarios[0].marineLicence)

      const response = await makePostRequest({
        url: marineLicenceRoutes.MARINE_LICENCE_REVIEW_SITE_DETAILS,
        server: getServer(),
        formData: { addActivity: 'addActivity', siteNumber: '1' }
      })

      expect(response.statusCode).toBe(statusCodes.redirect)
      expect(response.headers.location).toBe(
        `${marineLicenceRoutes.MARINE_LICENCE_REVIEW_SITE_DETAILS}#activity-details-site-1-activity-3`
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
  }

  const validateFileUpload = (document, expected, siteIndex) => {
    const cards = document.querySelectorAll('.govuk-summary-card')
    const siteDetailsCards = Array.from(cards).filter((card) =>
      card.textContent.match(/Site \d+(?! - Activity)/)
    )

    siteDetailsCards.forEach((card, i) => {
      const siteNameRow = getRowByKey(card, 'Site name')

      const siteNameExpected = expected.siteDetails[siteIndex].siteName

      expect(siteNameRow.textContent).toContain(
        expectedValueOrIncomplete(siteNameExpected)
      )

      validateActionLink(siteNameRow, siteNameExpected, siteIndex)

      const mapViewRow = getRowByKey(card, 'Map view')
      expect(mapViewRow).toBeTruthy()
      expect(mapViewRow.textContent.trim()).toBe('Map view')

      const mapDiv = mapViewRow.querySelector(
        '.app-site-details-map[data-module="site-details-map"]'
      )
      expect(mapDiv).toBeTruthy()

      const addAnotherActivitybutton = getByRole(document, 'button', {
        name: `Add another activity for site ${siteIndex + 1}`
      })
      expect(addAnotherActivitybutton).toBeInTheDocument()
    })

    const activityDetailsCards = Array.from(cards).filter((card) =>
      card.textContent.match(/Site \d+(?= - Activity)/)
    )

    activityDetailsCards.forEach((card, i) => {
      const activityDetails = expected.siteDetails[siteIndex].activityDetails[i]

      const actionList = card.querySelector('.govuk-summary-card__actions')

      if (i === 0) {
        expect(actionList).toBeNull()
      } else {
        expect(actionList).toBeTruthy()

        const deleteLink = within(actionList).getByRole('link', {
          name: /Delete activity/
        })

        expect(deleteLink).toHaveAttribute(
          'href',
          expect.stringContaining(`delete-activity?site=1&activity=${i + 1}`)
        )
      }

      const activityTypeRow = getRowByKey(card, 'Type of activity')
      expect(activityTypeRow).toBeTruthy()
      expect(activityTypeRow.textContent).toContain(
        expectedValueOrIncomplete(activityDetails.activityType)
      )

      const activityDescriptionRow = getRowByKey(card, 'Activity description')
      expect(activityDescriptionRow).toBeTruthy()
      expect(activityDescriptionRow.textContent).toContain(
        expectedValueOrIncomplete(activityDetails.activityDescription)
      )

      const activityDurationRow = getRowByKey(
        card,
        'Maximum duration of activity'
      )
      expect(activityDurationRow).toBeTruthy()
      expect(activityDurationRow.textContent).toContain(
        expectedValueOrIncomplete(activityDetails.activityDuration)
      )

      const completionDateRow = getRowByKey(card, 'Completion date')
      expect(completionDateRow).toBeTruthy()
      expect(completionDateRow.textContent).toContain(
        expectedValueOrIncomplete(activityDetails.completionDate)
      )

      const activityMonthsRow = getRowByKey(
        card,
        'Activity limited to specific months'
      )
      expect(activityMonthsRow).toBeTruthy()
      expect(activityMonthsRow.textContent).toContain(
        expectedValueOrIncomplete(activityDetails.activityMonths)
      )

      const workingHoursRow = getRowByKey(card, 'Proposed working hours')
      expect(workingHoursRow).toBeTruthy()
      expect(workingHoursRow.textContent).toContain(
        expectedValueOrIncomplete(activityDetails.workingHours)
      )
    })
  }
})
