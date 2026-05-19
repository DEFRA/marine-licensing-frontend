import { vi } from 'vitest'
import {
  marineLicenceRoutes,
  routes
} from '#src/server/common/constants/routes.js'
import {
  getFileUploadBackLink,
  getManualEntryBackLink,
  hasIncompleteFields,
  MANUAL_ENTRY_REVIEW_VIEW_ROUTE,
  renderFileUploadReview,
  renderManualEntryReview
} from '#src/server/marine-licence/site-details/review-site-details/utils.js'
import { getFileUploadSummaryData } from '#src/server/common/helpers/review-site-details/file-upload.js'
import { createSiteDetailsDataJson } from '#src/server/common/helpers/site-details.js'

vi.mock('~/src/server/common/helpers/marine-licence/session-cache/utils.js')

vi.mock(
  '~/src/server/common/helpers/review-site-details/file-upload.js',
  () => ({
    getFileUploadSummaryData: vi.fn()
  })
)

vi.mock('~/src/server/common/helpers/site-details.js', () => ({
  createSiteDetailsDataJson: vi.fn()
}))

describe('siteDetails utils', () => {
  describe('getFileUploadBackLink util', () => {
    test('getFileUploadBackLink correctly returns task list when coming from the task list', () => {
      expect(getFileUploadBackLink(`http://hostname${routes.TASK_LIST}`)).toBe(
        routes.TASK_LIST
      )
    })

    test('getFileUploadBackLink correctly returns file upload route', () => {
      expect(
        getFileUploadBackLink(`http://hostname${routes.ACTIVITY_DESCRIPTION}`)
      ).toBe(routes.ACTIVITY_DESCRIPTION)
    })

    test('getFileUploadBackLink correctly returns file upload as fallback', () => {
      expect(getFileUploadBackLink(undefined)).toBe(
        marineLicenceRoutes.MARINE_LICENCE_FILE_UPLOAD
      )
    })

    test('getFileUploadBackLink correctly handles invalid URLs', () => {
      expect(getFileUploadBackLink('invalid-url')).toBe(
        marineLicenceRoutes.MARINE_LICENCE_FILE_UPLOAD
      )
    })

    test('getFileUploadBackLink correctly handles check your answers redirect', () => {
      expect(getFileUploadBackLink('any page', true)).toBe(
        marineLicenceRoutes.MARINE_LICENCE_CHECK_YOUR_ANSWERS
      )
    })
  })

  describe('renderFileUploadReview util', () => {
    const mockH = {
      view: vi.fn()
    }

    test('renderFileUploadReview renders correct view with data', () => {
      const mockCoordinates = [
        { type: 'Point', coordinates: [51.5074, -0.1278] }
      ]
      const mockGeoJSON = {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            geometry: { type: 'Point', coordinates: [51.5074, -0.1278] }
          }
        ]
      }
      const mockSiteDetailsData = '{"coordinatesType":"file"}'

      getFileUploadSummaryData.mockReturnValue({
        coordinates: mockCoordinates,
        geoJSON: mockGeoJSON
      })
      createSiteDetailsDataJson.mockReturnValue(mockSiteDetailsData)

      const marineLicence = {
        projectName: 'Test Project'
      }
      const siteDetails = [
        {
          coordinatesType: 'file',
          fileUploadType: 'kml',
          uploadedFile: {
            filename: 'test-site.kml'
          },
          geoJSON: mockGeoJSON,
          siteName: 'File Upload Site 1'
        }
      ]
      const previousPage = `http://hostname${marineLicenceRoutes.MARINE_LICENCE_FILE_UPLOAD}`
      const reviewSiteDetailsPageData = {
        pageTitle: 'Review site details'
      }

      renderFileUploadReview(mockH, {
        marineLicence,
        siteDetails,
        previousPage,
        reviewSiteDetailsPageData
      })

      expect(mockH.view).toHaveBeenCalledWith(
        'marine-licence/site-details/review-site-details/file-upload-review',
        expect.objectContaining({
          pageTitle: 'Review site details',
          backLink: marineLicenceRoutes.MARINE_LICENCE_FILE_UPLOAD,
          projectName: 'Test Project',
          summaryData: [
            {
              activityDetails: [],
              coordinates: mockCoordinates,
              geoJSON: mockGeoJSON,
              siteName: 'File Upload Site 1',
              siteNumber: 1,
              siteDetailsData: mockSiteDetailsData
            }
          ]
        })
      )
    })
  })

  describe('getManualEntryBackLink util', () => {
    test('returns enter-multiple-coordinates when coming from that page', () => {
      expect(
        getManualEntryBackLink(
          `http://hostname${marineLicenceRoutes.MARINE_LICENCE_ENTER_MULTIPLE_COORDINATES}`
        )
      ).toBe(marineLicenceRoutes.MARINE_LICENCE_ENTER_MULTIPLE_COORDINATES)
    })

    test('returns width-of-site when coming from that page', () => {
      expect(
        getManualEntryBackLink(
          `http://hostname${marineLicenceRoutes.MARINE_LICENCE_WIDTH_OF_SITE}`
        )
      ).toBe(marineLicenceRoutes.MARINE_LICENCE_WIDTH_OF_SITE)
    })

    test('returns task list when coming from task list', () => {
      expect(getManualEntryBackLink(`http://hostname${routes.TASK_LIST}`)).toBe(
        routes.TASK_LIST
      )
    })

    test('returns width-of-site as fallback for undefined', () => {
      expect(getManualEntryBackLink(undefined)).toBe(
        marineLicenceRoutes.MARINE_LICENCE_WIDTH_OF_SITE
      )
    })

    test('returns width-of-site as fallback for invalid URL', () => {
      expect(getManualEntryBackLink('invalid-url')).toBe(
        marineLicenceRoutes.MARINE_LICENCE_WIDTH_OF_SITE
      )
    })

    test('returns check-your-answers when returnToCheckYourAnswers is true', () => {
      expect(getManualEntryBackLink('any page', true)).toBe(
        marineLicenceRoutes.MARINE_LICENCE_CHECK_YOUR_ANSWERS
      )
    })
  })

  describe('renderManualEntryReview util', () => {
    const mockH = { view: vi.fn() }

    test('renders the manual-entry view with correct data', () => {
      createSiteDetailsDataJson.mockReturnValue('{}')

      const marineLicence = { projectName: 'Test Project' }
      const siteDetails = [
        {
          coordinatesType: 'coordinates',
          coordinatesEntry: 'single',
          coordinateSystem: 'wgs84',
          coordinates: { latitude: '51.5074', longitude: '-0.1278' },
          circleWidth: '100',
          siteName: 'Manual Site'
        }
      ]
      const previousPage = `http://hostname${marineLicenceRoutes.MARINE_LICENCE_WIDTH_OF_SITE}`

      renderManualEntryReview(mockH, {
        marineLicence,
        siteDetails,
        previousPage,
        reviewSiteDetailsPageData: { pageTitle: 'Review site details' }
      })

      expect(mockH.view).toHaveBeenCalledWith(
        MANUAL_ENTRY_REVIEW_VIEW_ROUTE,
        expect.objectContaining({
          pageTitle: 'Review site details',
          backLink: marineLicenceRoutes.MARINE_LICENCE_WIDTH_OF_SITE,
          projectName: 'Test Project',
          summaryData: expect.arrayContaining([
            expect.objectContaining({
              siteName: 'Manual Site',
              siteNumber: 1,
              coordinates: '51.5074, -0.1278',
              activityDetails: []
            })
          ])
        })
      )
    })
  })

  describe('hasIncompleteFields util', () => {
    test('should return false for null, undefined, or empty inputs', () => {
      expect(hasIncompleteFields(null)).toBe(false)
      expect(hasIncompleteFields(undefined)).toBe(false)
      expect(hasIncompleteFields([])).toBe(false)
      expect(hasIncompleteFields([{ siteName: 'Test' }])).toBe(false)
    })

    test('should return false when all required fields are present', () => {
      expect(
        hasIncompleteFields([
          {
            siteName: 'Site 1'
          },
          {
            siteName: 'Site 2'
          }
        ])
      ).toBe(false)
    })

    test('should return true when any site in multiple sites is incomplete', () => {
      expect(
        hasIncompleteFields([
          {
            siteName: 'Site 1'
          },
          {
            siteName: ''
          }
        ])
      ).toBe(true)
    })
  })
})
