import { beforeEach, vi } from 'vitest'
import Boom from '@hapi/boom'
import { routes } from '#src/server/common/constants/routes.js'
import {
  getFileUploadBackLink,
  getSiteDetailsBackLink,
  handleSubmissionError,
  hasIncompleteFields,
  renderFileUploadReview,
  renderManualCoordinateReview
} from '#src/server/exemption/site-details/review-site-details/utils.js'
import { createMockRequest } from '#src/server/test-helpers/mocks/helpers.js'

import { getCoordinateSystem } from '#src/server/common/helpers/coordinate-utils.js'

vi.mock('~/src/server/common/helpers/exemptions/session-cache/utils.js')

vi.mock('#src/server/common/helpers/coordinate-utils.js', () => ({
  getCoordinateSystem: vi.fn(),
  extractCoordinatesFromGeoJSON: vi.fn()
}))

describe('siteDetails utils', () => {
  const mockRequest = createMockRequest()

  describe('getSiteDetailsBackLink util', () => {
    test('getSiteDetailsBackLink correctly returns task list when coming from the task list', () => {
      expect(getSiteDetailsBackLink(`http://hostname${routes.TASK_LIST}`)).toBe(
        routes.TASK_LIST
      )
    })

    test('getSiteDetailsBackLink correctly returns page when coming from circle width page', () => {
      expect(
        getSiteDetailsBackLink(`http://hostname${routes.WIDTH_OF_SITE}`)
      ).toBe(routes.WIDTH_OF_SITE)
    })

    test('getSiteDetailsBackLink correctly returns fallback option', () => {
      expect(getSiteDetailsBackLink(undefined)).toBe(routes.TASK_LIST)
    })

    test('getSiteDetailsBackLink correctly returns to check your answers', () => {
      expect(getSiteDetailsBackLink('any page', 'multiple', true)).toBe(
        routes.CHECK_YOUR_ANSWERS
      )
    })
  })

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
      expect(getFileUploadBackLink(undefined)).toBe(routes.FILE_UPLOAD)
    })

    test('getFileUploadBackLink correctly handles invalid URLs', () => {
      expect(getFileUploadBackLink('invalid-url')).toBe(routes.FILE_UPLOAD)
    })

    test('getFileUploadBackLink correctly handles check your answers redirect', () => {
      expect(getFileUploadBackLink('any page', true)).toBe(
        routes.CHECK_YOUR_ANSWERS
      )
    })
  })

  describe('renderFileUploadReview util', () => {
    const mockH = {
      view: vi.fn()
    }

    test('renderFileUploadReview renders correct view with data', () => {
      const exemption = {
        multipleSiteDetails: { multipleSitesEnabled: false },
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
      const previousPage = `http://hostname${routes.FILE_UPLOAD}`
      const reviewSiteDetailsPageData = {
        pageTitle: 'Review site details'
      }

      renderFileUploadReview(mockH, {
        exemption,
        siteDetails,
        previousPage,
        reviewSiteDetailsPageData
      })

      expect(mockH.view).toHaveBeenCalledWith(
        'exemption/site-details/review-site-details/file-upload-review',
        expect.objectContaining({
          pageTitle: 'Review site details',
          backLink: routes.FILE_UPLOAD,
          projectName: 'Test Project',
          summaryData: expect.arrayContaining([
            expect.objectContaining({
              coordinates: [
                {
                  type: 'Point',
                  coordinates: [51.5074, -0.1278]
                }
              ]
            })
          ]),
          multipleSiteDetailsData: expect.objectContaining({
            method: 'Upload a file with the coordinates of the site',
            multipleSiteDetails: 'No',
            sameActivityDates: 'No',
            sameActivityDescription: 'No',
            fileType: 'KML',
            filename: 'test-site.kml'
          })
        })
      )
    })
  })

  describe('renderManualCoordinateReview util', () => {
    const mockH = {
      view: vi.fn()
    }

    beforeEach(() => {
      getCoordinateSystem.mockReturnValue({
        coordinateSystem: 'WGS84'
      })
    })

    test('renderManualCoordinateReview renders correct view with data', () => {
      const siteDetails = [
        {
          activityDates: {
            start: '2025-01-01T00:00:00.000Z',
            end: '2025-01-01T00:00:00.000Z'
          },
          activityDescription: 'Test activity description',
          coordinatesEntry: 'single',
          coordinatesType: 'coordinates',
          coordinates: {
            latitude: '51.5074',
            longitude: '-0.1278'
          },
          circleWidth: '100',
          siteName: 'Manual Coordinate Site 1'
        }
      ]
      const previousPage = `http://hostname${routes.WIDTH_OF_SITE}`
      const reviewSiteDetailsPageData = {
        pageTitle: 'Review site details'
      }

      const exemption = {
        projectName: 'Test Project',
        multipleSiteDetails: {},
        siteDetails
      }

      renderManualCoordinateReview(mockH, {
        exemption,
        siteDetails,
        previousPage,
        reviewSiteDetailsPageData
      })

      expect(mockH.view).toHaveBeenCalledWith(
        'exemption/site-details/review-site-details/index',
        expect.objectContaining({
          pageTitle: 'Review site details',
          backLink: routes.WIDTH_OF_SITE,
          isMultiSiteJourney: false,
          projectName: 'Test Project',
          summaryData: expect.arrayContaining([
            expect.objectContaining({
              activityDates: '1 January 2025 to 1 January 2025',
              activityDescription: 'Test activity description',
              method:
                'Manually enter one set of coordinates and a width to create a circular site',
              showActivityDates: true,
              showActivityDescription: true,
              siteName: 'Manual Coordinate Site 1'
            })
          ]),
          multipleSiteDetailsData: expect.objectContaining({
            method: 'Enter the coordinates of the site manually',
            multipleSiteDetails: 'No',
            sameActivityDates: 'No',
            sameActivityDescription: 'No'
          })
        })
      )
    })
  })

  describe('handleSubmissionError util', () => {
    test('handleSubmissionError logs error and returns Boom error', () => {
      const error = new Error('Test error message')
      const exemptionId = 'test-exemption-id'
      const coordinatesType = 'coordinates'

      const result = handleSubmissionError(
        mockRequest,
        error,
        exemptionId,
        coordinatesType
      )

      expect(mockRequest.logger.error).toHaveBeenCalledWith(
        {
          err: expect.any(Error),
          exemptionId: 'test-exemption-id',
          coordinatesType: 'coordinates'
        },
        'Error submitting site review'
      )

      expect(Boom.isBoom(result)).toBe(true)
      expect(result.output.statusCode).toBe(400)
      expect(result.message).toBe('Error submitting site review')
    })
  })

  describe('hasIncompleteFields util', () => {
    test('should return false for null, undefined, or empty inputs', () => {
      expect(hasIncompleteFields(null, {})).toBe(false)
      expect(hasIncompleteFields(undefined, {})).toBe(false)
      expect(hasIncompleteFields([], {})).toBe(false)
      expect(hasIncompleteFields([{ siteName: 'Test' }], null)).toBe(false)
    })

    test('should return true when siteName is missing or empty in multi-site journey', () => {
      const multipleSiteDetails = { multipleSitesEnabled: true }

      expect(
        hasIncompleteFields(
          [{ activityDates: { start: '2025-01-01', end: '2025-01-02' } }],
          multipleSiteDetails
        )
      ).toBe(true)

      expect(hasIncompleteFields([{ siteName: '' }], multipleSiteDetails)).toBe(
        true
      )

      expect(
        hasIncompleteFields([{ siteName: '   ' }], multipleSiteDetails)
      ).toBe(true)
    })

    test('should return true when activity dates are missing and sameActivityDates is no', () => {
      const multipleSiteDetails = {
        multipleSitesEnabled: true,
        sameActivityDates: 'no'
      }

      expect(
        hasIncompleteFields(
          [{ siteName: 'Test Site', activityDescription: 'Test' }],
          multipleSiteDetails
        )
      ).toBe(true)

      expect(
        hasIncompleteFields(
          [
            {
              siteName: 'Test Site',
              activityDates: { start: '2025-01-01' }
            }
          ],
          multipleSiteDetails
        )
      ).toBe(true)
    })

    test('should return true when activity description is missing and sameActivityDescription is no', () => {
      const multipleSiteDetails = {
        multipleSitesEnabled: true,
        sameActivityDescription: 'no'
      }

      expect(
        hasIncompleteFields(
          [
            {
              siteName: 'Test Site',
              activityDates: { start: '2025-01-01', end: '2025-01-02' }
            }
          ],
          multipleSiteDetails
        )
      ).toBe(true)

      expect(
        hasIncompleteFields(
          [
            {
              siteName: 'Test Site',
              activityDescription: '   '
            }
          ],
          multipleSiteDetails
        )
      ).toBe(true)
    })

    test('should return false when all required fields are present', () => {
      expect(
        hasIncompleteFields(
          [
            {
              siteName: 'Site 1',
              activityDates: { start: '2025-01-01', end: '2025-01-02' },
              activityDescription: 'Description 1'
            },
            {
              siteName: 'Site 2',
              activityDates: { start: '2025-01-03', end: '2025-01-04' },
              activityDescription: 'Description 2'
            }
          ],
          {
            multipleSitesEnabled: true,
            sameActivityDates: 'no',
            sameActivityDescription: 'no'
          }
        )
      ).toBe(false)
    })

    test('should return false when sameActivityDates or sameActivityDescription is yes', () => {
      expect(
        hasIncompleteFields([{ siteName: 'Test Site' }], {
          multipleSitesEnabled: true,
          sameActivityDates: 'yes',
          sameActivityDescription: 'yes'
        })
      ).toBe(false)
    })

    test('should return true when any site in multiple sites is incomplete', () => {
      expect(
        hasIncompleteFields(
          [
            {
              siteName: 'Site 1',
              activityDates: { start: '2025-01-01', end: '2025-01-02' },
              activityDescription: 'Description 1'
            },
            {
              siteName: '',
              activityDates: { start: '2025-01-03', end: '2025-01-04' },
              activityDescription: 'Description 2'
            }
          ],
          { multipleSitesEnabled: true }
        )
      ).toBe(true)
    })
  })
})
