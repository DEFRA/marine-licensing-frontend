import { JSDOM } from 'jsdom'
import { getByText, queryByText, within } from '@testing-library/dom'
import { routes } from '~/src/server/common/constants/routes.js'
import { statusCodes } from '~/src/server/common/constants/status-codes.js'
import * as authRequests from '~/src/server/common/helpers/authenticated-requests.js'
import * as cacheUtils from '~/src/server/common/helpers/session-cache/utils.js'
import { testScenarios } from './file-upload-fixtures.js'

import {
  makeGetRequest,
  makePostRequest
} from '~/src/server/test-helpers/server-requests.js'
import { setupTestServer } from '~/tests/integration/shared/test-setup-helpers.js'

jest.mock('~/src/server/common/helpers/session-cache/utils.js')
jest.mock('~/src/server/common/helpers/coordinate-utils.js')
jest.mock('~/src/server/common/helpers/authenticated-requests.js')

const getSiteDetailsCard = (document, expected, siteIndex = 0) => {
  const cardName = expected?.siteDetails[siteIndex]?.cardName ?? 'Site details'
  const heading = within(document).getByRole('heading', {
    level: 2,
    name: cardName
  })
  return heading.closest('.govuk-summary-card')
}

describe('Review Site Details - File Upload Integration Tests', () => {
  const getServer = setupTestServer()

  beforeEach(() => {
    jest
      .spyOn(cacheUtils, 'setExemptionCache')
      .mockImplementation(() => undefined)
    jest
      .spyOn(cacheUtils, 'resetExemptionSiteDetails')
      .mockImplementation(() => undefined)
  })

  test.each(testScenarios)(
    '$name - validates file upload display',
    async ({ exemption, expectedPageContent }) => {
      expect.hasAssertions()

      const document = await getPageDocument(exemption)

      const isMultipleSites =
        exemption.multipleSiteDetails?.multipleSitesEnabled

      validatePageStructure(document, expectedPageContent)
      validateNavigationElements(document)

      if (isMultipleSites) {
        validateMultSiteActivityDetailsCard(document, expectedPageContent)
        validateMultipleSites(document, expectedPageContent)

        for (const site of expectedPageContent.siteDetails.keys()) {
          validateFileUpload(document, expectedPageContent, site)
          validateSiteDetailsCard(document, expectedPageContent, site)
        }
      } else {
        validateFileUpload(document, expectedPageContent, 0)
        validateSiteDetailsCard(document, expectedPageContent, 0)
      }
    }
  )

  describe('Form Submission', () => {
    test('should successfully submit file upload details', async () => {
      const fileExemption = testScenarios[0].exemption

      jest.spyOn(cacheUtils, 'getExemptionCache').mockReturnValue(fileExemption)
      jest.spyOn(authRequests, 'authenticatedPatchRequest').mockResolvedValue({
        payload: { id: fileExemption.id }
      })

      const response = await makePostRequest({
        url: routes.REVIEW_SITE_DETAILS,
        server: getServer(),
        formData: {}
      })

      expect(response.statusCode).toBe(statusCodes.redirect)
      expect(response.headers.location).toBe(routes.TASK_LIST)
      expect(authRequests.authenticatedPatchRequest).toHaveBeenCalledWith(
        expect.any(Object),
        '/exemption/site-details',
        expect.objectContaining({
          id: fileExemption.id,
          siteDetails: [
            expect.objectContaining({
              coordinatesType: 'file'
            })
          ]
        })
      )
    })
  })

  const getPageDocument = async (exemption) => {
    jest.spyOn(cacheUtils, 'getExemptionCache').mockReturnValue(exemption)
    jest.spyOn(authRequests, 'authenticatedGetRequest').mockResolvedValue({
      payload: { value: { taskList: { id: exemption.id } } }
    })

    const response = await makeGetRequest({
      server: getServer(),
      url: routes.REVIEW_SITE_DETAILS,
      headers: {
        referer: `http://localhost${routes.FILE_UPLOAD}`
      }
    })

    expect(response.statusCode).toBe(statusCodes.ok)
    return new JSDOM(response.result).window.document
  }

  const validatePageStructure = (document, expected) => {
    const heading = document.querySelector('h1')
    expect(heading.textContent.trim()).toBe('Review site details')

    const caption = document.querySelector('.govuk-caption-l')
    expect(caption.textContent.trim()).toBe(expected.projectName)

    const siteLocationCard = document.querySelectorAll('.govuk-summary-card')[0]

    const siteLocationCardTitle = siteLocationCard.querySelector(
      '.govuk-summary-card__title'
    )

    expect(siteLocationCardTitle.textContent.trim()).toBe(
      'Providing the site location'
    )

    const methodRow = getRowByKey(
      siteLocationCard,
      'Method of providing site location'
    )
    expect(methodRow).toBeTruthy()
    expect(methodRow.textContent).toContain(expected.multipleSiteDetails.method)

    const fileTypeRow = getRowByKey(siteLocationCard, 'File type')
    expect(fileTypeRow).toBeTruthy()
    expect(fileTypeRow.textContent).toContain(
      expected.multipleSiteDetails.fileType
    )

    const fileUploadedRow = getRowByKey(siteLocationCard, 'File uploaded')
    expect(fileUploadedRow).toBeTruthy()
    expect(fileUploadedRow.textContent).toContain(
      expected.multipleSiteDetails.fileUploaded
    )

    const backLink = document.querySelector('.govuk-back-link')
    expect(backLink.textContent.trim()).toBe('Back')
    expect(backLink.getAttribute('href')).toBe(routes.FILE_UPLOAD)
  }

  const validateMultipleSites = (document, expected) => {
    const heading = document.querySelector('h1')
    expect(heading.textContent.trim()).toBe('Review site details')

    const caption = document.querySelector('.govuk-caption-l')
    expect(caption.textContent.trim()).toBe(expected.projectName)

    if (expected.multipleSiteDetails.warning) {
      expect(
        getByText(document, `The site details you've provided are saved`)
      ).toBeInTheDocument()

      expect(
        getByText(document, /You must complete all sections marked/i)
      ).toBeInTheDocument()

      expect(
        getByText(
          document,
          `If you cannot finish now, you can return to this page later.`
        )
      ).toBeInTheDocument()
    } else {
      expect(
        queryByText(document, `The site details you've provided are saved`)
      ).not.toBeInTheDocument()

      expect(
        queryByText(document, /You must complete all sections marked/i)
      ).not.toBeInTheDocument()

      expect(
        queryByText(
          document,
          `If you cannot finish now, you can return to this page later.`
        )
      ).not.toBeInTheDocument()
    }

    const cards = document.querySelectorAll('.govuk-summary-card')
    const siteDetailsCards = Array.from(cards).filter((card) =>
      card.textContent.match(/Site \d+ details/g)
    )
    expect(siteDetailsCards).toHaveLength(expected.siteDetails.length)

    expect(
      within(document).getByRole('button', { name: 'Save and continue' })
    ).toHaveAttribute('type', 'submit')

    const backLink = document.querySelector('.govuk-back-link')
    expect(backLink.textContent.trim()).toBe('Back')
    expect(backLink.getAttribute('href')).toBe(routes.FILE_UPLOAD)
  }

  const validateMultSiteActivityDetailsCard = (document, expected) => {
    const siteCard = document.querySelectorAll('.govuk-summary-card')[1]
    expect(siteCard).toBeTruthy()

    const cardTitle = within(siteCard).getByRole('heading', { level: 2 })
    expect(cardTitle.textContent.trim()).toBe('Activity details')

    const sameActivityDatesRow = getRowByKey(
      siteCard,
      'Are the activity dates the same for every site?'
    )
    expect(sameActivityDatesRow.textContent).toContain(
      expected.multipleSiteDetails.sameActivityDates
    )

    const activityDatesRow = getRowByKey(siteCard, 'Activity dates')

    expected.multipleSiteDetails.sameActivityDates === 'Yes'
      ? expect(activityDatesRow.textContent).toContain(
          expected.multipleSiteDetails.activityDates
        )
      : expect(activityDatesRow).toBeFalsy()

    const sameActivityDescriptionRow = getRowByKey(
      siteCard,
      'Is the activity description the same for every site?'
    )
    expect(sameActivityDescriptionRow.textContent).toContain(
      expected.multipleSiteDetails.sameActivityDescription
    )

    const activityDescriptionRow = getRowByKey(siteCard, 'Activity description')

    expected.multipleSiteDetails.sameActivityDescription === 'Yes'
      ? expect(activityDescriptionRow.textContent).toContain(
          expected.multipleSiteDetails.activityDescription
        )
      : expect(activityDescriptionRow).toBeFalsy()
  }

  const validateSiteDetailsCard = (document, expected, siteIndex) => {
    const siteCard = getSiteDetailsCard(document, expected, siteIndex)

    const cardTitle = siteCard.querySelector('.govuk-summary-card__title')
    expect(cardTitle.textContent.trim()).toBe(
      expected.siteDetails[siteIndex].cardName
    )

    const siteNameRow = getRowByKey(siteCard, 'Site name')

    expected.multipleSiteDetails.multipleSiteDetails === 'Yes'
      ? expect(siteNameRow.textContent).toContain(
          expected.siteDetails[siteIndex].siteName
        )
      : expect(siteNameRow).toBeFalsy()

    const shouldIncludeActivityDates =
      expected.multipleSiteDetails.multipleSiteDetails === 'Yes' &&
      expected.multipleSiteDetails.sameActivityDates === 'No'

    const activityDatesRow = getRowByKey(siteCard, 'Activity dates')

    shouldIncludeActivityDates
      ? expect(activityDatesRow.textContent).toContain(
          expected.siteDetails[siteIndex].activityDates
        )
      : expect(activityDatesRow).toBeFalsy()

    const shouldIncludeActivityDescription =
      expected.multipleSiteDetails.multipleSiteDetails === 'Yes' &&
      expected.multipleSiteDetails.sameActivityDescription === 'No'

    const activityDescriptionRow = getRowByKey(siteCard, 'Activity description')

    shouldIncludeActivityDescription
      ? expect(activityDescriptionRow.textContent).toContain(
          expected.siteDetails[siteIndex].activityDescription
        )
      : expect(activityDescriptionRow).toBeFalsy()
  }

  const validateFileUpload = (document, expected, siteIndex) => {
    const siteCard = getSiteDetailsCard(document, expected, siteIndex)

    const mapViewRow = getRowByKey(siteCard, 'Map view')
    expect(mapViewRow).toBeTruthy()
    expect(mapViewRow.textContent.trim()).toBe('Map view')

    const mapDiv = mapViewRow.querySelector(
      '.app-site-details-map[data-module="site-details-map"]'
    )
    expect(mapDiv).toBeTruthy()
  }

  const validateNavigationElements = (document) => {
    expect(
      within(document).getByRole('button', { name: 'Save and continue' })
    ).toHaveAttribute('type', 'submit')
    expect(
      within(document).getByRole('link', { name: 'Cancel' })
    ).toHaveAttribute('href', '/exemption/task-list?cancel=site-details')
  }

  const getRowByKey = (card, keyText) => {
    const rows = card.querySelectorAll('.govuk-summary-list__row')
    return Array.from(rows).find((row) => {
      const keyElement = row.querySelector('.govuk-summary-list__key')
      return keyElement && keyElement.textContent.trim() === keyText
    })
  }
})
