import { getByRole, queryByRole } from '@testing-library/dom'
import { marineLicenceRoutes } from '~/src/server/common/constants/routes.js'
import {
  mockMarineLicence,
  setupTestServer
} from '~/tests/integration/shared/test-setup-helpers.js'
import { loadPage } from '~/tests/integration/shared/app-server.js'
import {
  mockFileUploadMarineLicence,
  mockManualCoordinatesMarineLicence,
  mockCircularMarineLicence,
  mockPolygonMarineLicence
} from '~/src/server/test-helpers/mocks/marine-licence-mocks.js'
import * as marineLicenceService from '~/src/services/marine-licence-service/index.js'
import { validateWaterFrameworkDirective } from '~/tests/integration/shared/summary-card-validators.js'
import {
  NAUTICAL_MILE_HEADING,
  EXCLUDED_ACTIVITIES_HEADING,
  PREVIOUS_ASSESSMENT_HEADING,
  ASSESSMENT_CHANGED_HEADING,
  FILE_UPLOAD_HEADING
} from '~/src/server/common/helpers/marine-licence/water-framework-directive/water-framework-review-data.js'

vi.mock('~/src/services/marine-licence-service/index.js')

const expectedWfdContent = {
  waterFrameworkDirective: {
    [NAUTICAL_MILE_HEADING]: 'Yes',
    [EXCLUDED_ACTIVITIES_HEADING]: 'No',
    [PREVIOUS_ASSESSMENT_HEADING]: 'Yes',
    [ASSESSMENT_CHANGED_HEADING]: 'No',
    [FILE_UPLOAD_HEADING]: 'test-upload-id'
  }
}

describe('Marine Licence Check Your Answers - site and activity cards', () => {
  const getServer = setupTestServer()

  const loadCyaPage = async (marineLicence) => {
    mockMarineLicence(marineLicence)
    vi.mocked(marineLicenceService.getMarineLicenceService).mockReturnValue({
      getMarineLicenceById: vi.fn().mockResolvedValue(marineLicence)
    })
    return loadPage({
      requestUrl: marineLicenceRoutes.MARINE_LICENCE_CHECK_YOUR_ANSWERS,
      server: getServer()
    })
  }

  describe('file-upload licence', () => {
    let document

    beforeEach(async () => {
      document = await loadCyaPage(mockFileUploadMarineLicence)
    })

    test('renders the page heading', () => {
      expect(
        getByRole(document, 'heading', {
          level: 2,
          name: 'Check your answers before sending your information'
        })
      ).toBeInTheDocument()
    })

    test('renders "Providing the site location" card with File upload method', () => {
      expect(
        getByRole(document, 'heading', {
          level: 2,
          name: 'Providing the site location'
        })
      ).toBeInTheDocument()

      const card = document.querySelector('#site-location-card')
      expect(card).toBeTruthy()
      expect(card.textContent).toContain('Method of providing site location')
      expect(card.textContent).toContain('File upload')
    })

    test('renders a Site 1 card with a Change link', () => {
      expect(
        getByRole(document, 'heading', { level: 2, name: 'Site 1' })
      ).toBeInTheDocument()

      const siteCard = document.querySelector('#site-details-1')
      expect(siteCard).toBeTruthy()
      const changeLink = siteCard.querySelector(
        '.govuk-summary-card__actions a'
      )
      expect(changeLink).toBeTruthy()
      expect(changeLink.textContent).toContain('Change')
      expect(changeLink.getAttribute('href')).toContain(
        '?from=check-your-answers'
      )
    })

    test('renders the water framework directive card with a Change link', () => {
      const wfdCard = document.querySelector('#water-framework-directive-card')
      expect(wfdCard).toBeTruthy()

      const changeLink = wfdCard.querySelector('.govuk-summary-card__actions a')
      expect(changeLink).toBeTruthy()
      expect(changeLink.textContent).toContain('Change')
      expect(changeLink.getAttribute('href')).toBe(
        `${marineLicenceRoutes.MARINE_LICENCE_WATER_FRAMEWORK_DIRECTIVE_REVIEW_YOUR_ANSWERS}?from=check-your-answers`
      )
    })

    test('renders activity card with card-level Change link and no row-level actions', () => {
      const activityCards = document.querySelectorAll(
        '[id^="activity-details-site-1-activity-"]'
      )
      expect(activityCards.length).toBeGreaterThan(0)

      const activityCard = activityCards[0]
      const cardChangeLink = activityCard.querySelector(
        '.govuk-summary-card__actions a'
      )
      expect(cardChangeLink).toBeTruthy()
      expect(cardChangeLink.textContent).toContain('Change')
      expect(
        activityCard.querySelectorAll('.govuk-summary-list__actions')
      ).toHaveLength(0)
      validateWaterFrameworkDirective(document, expectedWfdContent)
    })
  })

  describe('manual-coordinates licence', () => {
    let document

    beforeEach(async () => {
      document = await loadCyaPage(mockManualCoordinatesMarineLicence)
    })

    test('renders "Providing the site location" card with manual entry method', () => {
      const card = document.querySelector('#site-location-card')
      expect(card).toBeTruthy()
      expect(card.textContent).toContain(
        'Enter the coordinates of the site manually'
      )
    })

    test('renders a Site 1 card', () => {
      expect(
        getByRole(document, 'heading', { level: 2, name: 'Site 1' })
      ).toBeInTheDocument()
      validateWaterFrameworkDirective(document, expectedWfdContent)
    })
  })

  describe('circular-coordinates licence', () => {
    let document

    beforeEach(async () => {
      document = await loadCyaPage(mockCircularMarineLicence)
    })

    test('renders a Site 1 card with circular coordinate rows', () => {
      expect(
        getByRole(document, 'heading', { level: 2, name: 'Site 1' })
      ).toBeInTheDocument()

      const siteCard = document.querySelector('#site-details-1')
      expect(siteCard).toBeTruthy()
      expect(siteCard.textContent).toContain(
        'Single or multiple sets of coordinates'
      )
      expect(siteCard.textContent).toContain('100 metres')
      validateWaterFrameworkDirective(document, expectedWfdContent)
    })
  })

  describe('polygon-coordinates licence', () => {
    let document

    beforeEach(async () => {
      document = await loadCyaPage(mockPolygonMarineLicence)
    })

    test('renders a Site 1 card with polygon coordinate rows', () => {
      expect(
        getByRole(document, 'heading', { level: 2, name: 'Site 1' })
      ).toBeInTheDocument()

      const siteCard = document.querySelector('#site-details-1')
      expect(siteCard).toBeTruthy()
      expect(siteCard.textContent).toContain(
        'Single or multiple sets of coordinates'
      )
      expect(siteCard.textContent).toContain('55.123456, 55.123456')
      validateWaterFrameworkDirective(document, expectedWfdContent)
    })
  })

  describe('licence with no sites', () => {
    let document

    beforeEach(async () => {
      document = await loadCyaPage({
        ...mockFileUploadMarineLicence,
        siteDetails: []
      })
    })

    test('does not render site or activity cards', () => {
      expect(
        queryByRole(document, 'heading', { level: 2, name: 'Site 1' })
      ).not.toBeInTheDocument()
      expect(document.querySelector('#site-location-card')).toBeFalsy()
    })

    test('still renders the project details card', () => {
      expect(
        getByRole(document, 'heading', { level: 2, name: 'Project details' })
      ).toBeInTheDocument()
      validateWaterFrameworkDirective(document, expectedWfdContent)
    })
  })
})
