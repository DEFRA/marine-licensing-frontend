import { getByRole, getByText, queryByText } from '@testing-library/dom'
import { JSDOM } from 'jsdom'
import { COORDINATE_SYSTEMS } from '~/src/server/common/constants/exemptions.js'
import { routes } from '~/src/server/common/constants/routes.js'
import { statusCodes } from '~/src/server/common/constants/status-codes.js'
import * as authRequests from '~/src/server/common/helpers/authenticated-requests.js'
import * as cacheUtils from '~/src/server/common/helpers/session-cache/utils.js'
import { createServer } from '~/src/server/index.js'
import { mockExemption } from '~/src/server/test-helpers/mocks.js'

jest.mock('~/src/server/common/helpers/session-cache/utils.js')
jest.mock('~/src/server/common/helpers/authenticated-requests.js')

const SAMPLE_COORDINATES = {
  OSGB36_EASTINGS_NORTHINGS: { eastings: '123456', northings: '654321' },
  WGS84_LATITUDE_LONGITUDE: { latitude: '50.123456', longitude: '-1.234567' },
  INVALID_COORDINATES: { latitude: 'invalid', longitude: 'coordinates' }
}

const CIRCLE_MEASUREMENTS = {
  STANDARD_CIRCLE_WIDTH: '100',
  LARGE_CIRCLE_WIDTH: '200',
  NO_CIRCLE: null
}

const FILE_UPLOAD_EXAMPLES = {
  SHAPEFILE: {
    type: 'shapefile',
    filename: 'test-site.zip',
    displayName: 'Shapefile'
  },
  KML: { type: 'kml', filename: 'test-site.kml', displayName: 'KML file' }
}

const PORTSMOUTH_UK_COORDINATES = [-1.234567, 50.123456]

const SAMPLE_GEOJSON_POINT = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: PORTSMOUTH_UK_COORDINATES
      }
    }
  ]
}

const EXPECTED_UI_TEXT = {
  PAGE_HEADING: 'Review site details',
  BACK_BUTTON: 'Back',
  CONTINUE_BUTTON: 'Save and continue',
  CANCEL_BUTTON: 'Cancel',
  MAP_VIEW_INDICATOR: 'Map view',
  FILE_UPLOAD_METHOD: 'Upload a file with the coordinates of the site',
  OSGB36_DISPLAY: 'OSGB36 (National Grid)Eastings and Northings',
  COORDINATE_CENTRE_LABEL: 'Coordinates at centre of site',
  COORDINATE_SYSTEM_LABEL: 'Coordinate system',
  LOCATION_METHOD_LABEL: 'Method of providing site location'
}

const CSS_SELECTORS = {
  MAP_CONTAINER: '.app-site-details-map',
  SITE_DATA_SCRIPT: '#site-details-data',
  BACK_LINK: '.govuk-back-link',
  SUMMARY_ROWS: '.govuk-summary-list__row',
  SUMMARY_KEY: '.govuk-summary-list__key',
  SUMMARY_VALUE: '.govuk-summary-list__value',
  OPENLAYERS_CSS: 'link[href="/public/stylesheets/ol.css"]'
}

const MAP_MODULE_NAME = 'site-details-map'

describe('Review Site Details Page - Interactive Map Display and Data Verification', () => {
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

    jest
      .spyOn(cacheUtils, 'resetExemptionSiteDetails')
      .mockReturnValue({ siteDetails: null })

    jest.spyOn(authRequests, 'authenticatedPatchRequest').mockResolvedValue({
      payload: {
        id: mockExemption.id,
        siteDetails: mockExemption.siteDetails
      }
    })
  })

  const createExemptionWithSiteDetails = (siteDetailsOverride = {}) => ({
    ...mockExemption,
    siteDetails: {
      ...mockExemption.siteDetails,
      ...siteDetailsOverride
    }
  })

  const renderReviewPageForAuthenticatedUserWith = async (
    exemption = mockExemption
  ) => {
    jest.spyOn(cacheUtils, 'getExemptionCache').mockReturnValue(exemption)

    if (exemption.siteDetails?.coordinateSystem) {
      jest.spyOn(cacheUtils, 'getCoordinateSystem').mockReturnValue({
        coordinateSystem: exemption.siteDetails.coordinateSystem
      })
    }

    jest.spyOn(authRequests, 'authenticatedGetRequest').mockResolvedValue({
      payload: { value: exemption }
    })

    const response = await server.inject({
      method: 'GET',
      url: routes.REVIEW_SITE_DETAILS,
      headers: {
        referer: `http://localhost/${routes.WIDTH_OF_SITE}`
      },
      auth: {
        strategy: 'session',
        credentials: {
          userId: 'test-user-id',
          sessionId: 'test-session-id'
        }
      }
    })

    expect(response.statusCode).toBe(statusCodes.ok)
    return new JSDOM(response.result).window.document
  }

  const expectInteractiveMapToBeDisplayedIn = (document) => {
    const mapContainer = document.querySelector(CSS_SELECTORS.MAP_CONTAINER)

    expect(mapContainer).toBeInTheDocument()
    expect(mapContainer.getAttribute('data-module')).toBe(MAP_MODULE_NAME)
  }

  const expectSiteDataToBeEmbeddedAs = (document, expectedSiteData) => {
    const dataScript = document.querySelector(CSS_SELECTORS.SITE_DATA_SCRIPT)
    expect(dataScript).toBeInTheDocument()

    const embeddedSiteData = JSON.parse(dataScript.textContent)
    Object.entries(expectedSiteData).forEach(
      ([propertyName, expectedValue]) => {
        expect(embeddedSiteData[propertyName]).toEqual(expectedValue)
      }
    )
  }

  const expectSummaryToShow = (document, labelText, expectedValue) => {
    const summaryRows = document.querySelectorAll(CSS_SELECTORS.SUMMARY_ROWS)
    const targetRow = Array.from(summaryRows).find((row) => {
      const labelElement = row.querySelector(CSS_SELECTORS.SUMMARY_KEY)
      return labelElement?.textContent.trim() === labelText
    })

    expect(targetRow).toBeTruthy()

    const valueElement = targetRow.querySelector(CSS_SELECTORS.SUMMARY_VALUE)
    expect(valueElement.textContent.trim()).toBe(expectedValue)
  }

  describe('When applicant provided manual coordinates for a circular site area', () => {
    test('displays interactive map with site location when circle boundary is specified', async () => {
      const exemptionWithCircularSite = createExemptionWithSiteDetails({
        coordinateSystem: COORDINATE_SYSTEMS.WGS84,
        coordinates: SAMPLE_COORDINATES.WGS84_LATITUDE_LONGITUDE,
        circleWidth: CIRCLE_MEASUREMENTS.STANDARD_CIRCLE_WIDTH
      })

      const pageDocument = await renderReviewPageForAuthenticatedUserWith(
        exemptionWithCircularSite
      )

      expectInteractiveMapToBeDisplayedIn(pageDocument)
      const mapViewIndicator = queryByText(
        pageDocument,
        EXPECTED_UI_TEXT.MAP_VIEW_INDICATOR
      )
      expect(mapViewIndicator).toBeInTheDocument()
    })

    test('displays interactive map with precise point location when no circle boundary is specified', async () => {
      expect.hasAssertions()

      const exemptionWithPointSite = createExemptionWithSiteDetails({
        coordinateSystem: COORDINATE_SYSTEMS.OSGB36,
        coordinates: SAMPLE_COORDINATES.OSGB36_EASTINGS_NORTHINGS,
        circleWidth: CIRCLE_MEASUREMENTS.NO_CIRCLE
      })

      const pageDocument = await renderReviewPageForAuthenticatedUserWith(
        exemptionWithPointSite
      )

      expectInteractiveMapToBeDisplayedIn(pageDocument)
      expectSiteDataToBeEmbeddedAs(pageDocument, {
        coordinateSystem: COORDINATE_SYSTEMS.OSGB36,
        coordinates: SAMPLE_COORDINATES.OSGB36_EASTINGS_NORTHINGS,
        circleWidth: CIRCLE_MEASUREMENTS.NO_CIRCLE
      })

      expectSummaryToShow(
        pageDocument,
        EXPECTED_UI_TEXT.COORDINATE_SYSTEM_LABEL,
        EXPECTED_UI_TEXT.OSGB36_DISPLAY
      )
      expectSummaryToShow(
        pageDocument,
        EXPECTED_UI_TEXT.COORDINATE_CENTRE_LABEL,
        '123456, 654321'
      )
    })
  })

  describe('When applicant uploaded a file containing site boundary coordinates', () => {
    const createFileUploadSiteDetails = (fileUploadType, filename) => ({
      coordinatesType: 'file',
      fileUploadType,
      uploadedFile: { filename },
      geoJSON: SAMPLE_GEOJSON_POINT
    })

    test.each([
      [
        FILE_UPLOAD_EXAMPLES.SHAPEFILE.displayName,
        FILE_UPLOAD_EXAMPLES.SHAPEFILE.type,
        FILE_UPLOAD_EXAMPLES.SHAPEFILE.filename
      ],
      [
        FILE_UPLOAD_EXAMPLES.KML.displayName,
        FILE_UPLOAD_EXAMPLES.KML.type,
        FILE_UPLOAD_EXAMPLES.KML.filename
      ]
    ])(
      'displays interactive map showing site boundaries from %s data',
      async (fileTypeDisplayName, fileUploadType, filename) => {
        expect.hasAssertions()

        const exemptionWithUploadedSiteFile = createExemptionWithSiteDetails(
          createFileUploadSiteDetails(fileUploadType, filename)
        )

        const pageDocument = await renderReviewPageForAuthenticatedUserWith(
          exemptionWithUploadedSiteFile
        )

        expectInteractiveMapToBeDisplayedIn(pageDocument)
        expectSiteDataToBeEmbeddedAs(pageDocument, {
          coordinatesType: 'file',
          fileUploadType,
          geoJSON: SAMPLE_GEOJSON_POINT
        })

        expectSummaryToShow(
          pageDocument,
          EXPECTED_UI_TEXT.LOCATION_METHOD_LABEL,
          EXPECTED_UI_TEXT.FILE_UPLOAD_METHOD
        )
      }
    )
  })

  describe('When applicant accesses the review page to confirm their site details', () => {
    test('displays complete page structure with navigation controls for application workflow', async () => {
      const exemptionWithWGS84Coordinates = createExemptionWithSiteDetails({
        coordinateSystem: COORDINATE_SYSTEMS.WGS84,
        coordinates: SAMPLE_COORDINATES.WGS84_LATITUDE_LONGITUDE,
        circleWidth: CIRCLE_MEASUREMENTS.STANDARD_CIRCLE_WIDTH
      })

      const pageDocument = await renderReviewPageForAuthenticatedUserWith(
        exemptionWithWGS84Coordinates
      )

      const pageHeading = getByRole(pageDocument, 'heading', { level: 1 })
      expect(pageHeading).toHaveTextContent(EXPECTED_UI_TEXT.PAGE_HEADING)

      const projectNameDisplay = getByText(
        pageDocument,
        mockExemption.projectName
      )
      expect(projectNameDisplay).toBeInTheDocument()

      const backNavigationLink = pageDocument.querySelector(
        CSS_SELECTORS.BACK_LINK
      )
      expect(backNavigationLink).toBeInTheDocument()
      expect(backNavigationLink).toHaveTextContent(EXPECTED_UI_TEXT.BACK_BUTTON)

      const proceedToNextStepButton = getByRole(pageDocument, 'button', {
        name: EXPECTED_UI_TEXT.CONTINUE_BUTTON
      })
      expect(proceedToNextStepButton).toBeInTheDocument()

      const cancelApplicationButton = getByText(
        pageDocument,
        EXPECTED_UI_TEXT.CANCEL_BUTTON
      )
      expect(cancelApplicationButton).toBeInTheDocument()
    })

    test('includes OpenLayers stylesheet to enable interactive map functionality', async () => {
      const exemptionWithWGS84Coordinates = createExemptionWithSiteDetails({
        coordinateSystem: COORDINATE_SYSTEMS.WGS84,
        coordinates: SAMPLE_COORDINATES.WGS84_LATITUDE_LONGITUDE
      })

      const pageDocument = await renderReviewPageForAuthenticatedUserWith(
        exemptionWithWGS84Coordinates
      )

      const openLayersStylesheet = pageDocument.querySelector(
        CSS_SELECTORS.OPENLAYERS_CSS
      )
      expect(openLayersStylesheet).toBeInTheDocument()
      expect(openLayersStylesheet.getAttribute('rel')).toBe('stylesheet')
    })
  })

  describe('When applicant submits their confirmed site details', () => {
    test('processes application continuation successfully and redirects to next step', async () => {
      const exemptionWithLargeCircularSite = createExemptionWithSiteDetails({
        coordinateSystem: COORDINATE_SYSTEMS.WGS84,
        coordinates: SAMPLE_COORDINATES.WGS84_LATITUDE_LONGITUDE,
        circleWidth: CIRCLE_MEASUREMENTS.LARGE_CIRCLE_WIDTH
      })

      jest
        .spyOn(cacheUtils, 'getExemptionCache')
        .mockReturnValue(exemptionWithLargeCircularSite)

      const submissionResponse = await server.inject({
        method: 'POST',
        url: routes.REVIEW_SITE_DETAILS,
        payload: {
          csrfToken: 'valid-token'
        }
      })

      expect(submissionResponse.statusCode).toBe(statusCodes.redirect)
    })
  })

  describe('When handling incomplete or malformed site data gracefully', () => {
    test('displays page structure with map container even when site details are missing', async () => {
      const exemptionWithMissingSiteDetails = createExemptionWithSiteDetails({})

      const pageDocument = await renderReviewPageForAuthenticatedUserWith(
        exemptionWithMissingSiteDetails
      )

      expectInteractiveMapToBeDisplayedIn(pageDocument)

      const siteDataScript = pageDocument.querySelector(
        CSS_SELECTORS.SITE_DATA_SCRIPT
      )
      expect(siteDataScript).toBeInTheDocument()

      const embeddedSiteData = JSON.parse(siteDataScript.textContent)
      expect(embeddedSiteData).toBeDefined()
    })

    test('renders page successfully even when coordinate data contains invalid values', async () => {
      expect.hasAssertions()

      const exemptionWithMalformedCoordinates = createExemptionWithSiteDetails({
        coordinateSystem: COORDINATE_SYSTEMS.WGS84,
        coordinates: SAMPLE_COORDINATES.INVALID_COORDINATES,
        circleWidth: CIRCLE_MEASUREMENTS.NO_CIRCLE
      })

      const pageDocument = await renderReviewPageForAuthenticatedUserWith(
        exemptionWithMalformedCoordinates
      )

      expectInteractiveMapToBeDisplayedIn(pageDocument)
      expectSiteDataToBeEmbeddedAs(pageDocument, {
        coordinateSystem: COORDINATE_SYSTEMS.WGS84,
        coordinates: SAMPLE_COORDINATES.INVALID_COORDINATES
      })
    })
  })
})
