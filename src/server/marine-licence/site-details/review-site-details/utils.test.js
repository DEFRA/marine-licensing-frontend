import { vi } from 'vitest'
import {
  marineLicenceRoutes,
  routes
} from '#src/server/common/constants/routes.js'
import {
  getFileUploadBackLink,
  hasIncompleteFields,
  renderFileUploadReview
} from '#src/server/marine-licence/site-details/review-site-details/utils.js'

vi.mock('~/src/server/common/helpers/marine-licence/session-cache/utils.js')

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
          geoJSON: {
            type: 'FeatureCollection',
            features: [
              {
                type: 'Feature',
                geometry: {
                  type: 'Point',
                  coordinates: [51.5074, -0.1278]
                }
              }
            ]
          },
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
          projectName: 'Test Project'
        })
      )
    })
  })

  describe('hasIncompleteFields util', () => {
    test('should return false for null, undefined, or empty inputs', () => {
      expect(hasIncompleteFields(null, {})).toBe(false)
      expect(hasIncompleteFields(undefined, {})).toBe(false)
      expect(hasIncompleteFields([], {})).toBe(false)
      expect(hasIncompleteFields([{ siteName: 'Test' }], null)).toBe(false)
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
