import {
  mockMarineLicence,
  setupTestServer
} from '~/tests/integration/shared/test-setup-helpers.js'
import { loadPage } from '~/tests/integration/shared/app-server.js'
import { mockMarineLicenceApplication } from '#src/server/test-helpers/mocks/marine-licence-mocks.js'
import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'

const getCardOrder = (document) =>
  Array.from(
    document.querySelectorAll(
      '[id^="activity-details-site-"], [id^="construction-drawing-site-"], #add-another-activity-site-1, #add-another-construction-drawing-site-1'
    )
  ).map((el) => el.id)

describe('Review site details - construction drawing card', () => {
  const getServer = setupTestServer()

  describe('file upload coordinates journey', () => {
    test('renders one drawing card and the "Add another" button after the activity cards, in the correct order', async () => {
      mockMarineLicence(mockMarineLicenceApplication)

      const document = await loadPage({
        requestUrl: marineLicenceRoutes.MARINE_LICENCE_REVIEW_SITE_DETAILS,
        server: getServer()
      })

      expect(getCardOrder(document)).toEqual([
        'activity-details-site-1-activity-1',
        'activity-details-site-1-activity-2',
        'add-another-activity-site-1',
        'construction-drawing-site-1-1',
        'add-another-construction-drawing-site-1'
      ])

      const addDrawingButton = document.querySelector(
        '#add-another-construction-drawing-site-1'
      )
      expect(addDrawingButton.tagName).toBe('BUTTON')
      expect(addDrawingButton).toHaveAttribute('type', 'submit')
      expect(addDrawingButton).toHaveAttribute('name', 'addConstructionDrawing')
    })

    test('does not render drawing cards or button when no activity requires a drawing', async () => {
      mockMarineLicence({
        ...mockMarineLicenceApplication,
        siteDetails: [
          {
            ...mockMarineLicenceApplication.siteDetails[0],
            activityDetails: [
              {
                activityType: 'construction',
                activitySubType: 'construction-type-2'
              }
            ]
          }
        ]
      })

      const document = await loadPage({
        requestUrl: marineLicenceRoutes.MARINE_LICENCE_REVIEW_SITE_DETAILS,
        server: getServer()
      })

      expect(
        document.querySelector('[id^="construction-drawing-site-"]')
      ).toBeNull()
      expect(
        document.querySelector('#add-another-construction-drawing-site-1')
      ).toBeNull()
    })
  })

  describe('multiple drawings for a site', () => {
    test('numbers each drawing card sequentially and only shows a delete link from the second drawing onwards', async () => {
      mockMarineLicence({
        ...mockMarineLicenceApplication,
        siteDetails: [
          {
            ...mockMarineLicenceApplication.siteDetails[0],
            constructionDrawings: [
              {
                filename: 'drawing-one.pdf',
                s3Location: {
                  s3Bucket: 'test-bucket',
                  s3Key: 'test-key-1',
                  checksumSha256: 'test-checksum-1'
                }
              },
              {
                filename: 'drawing-two.pdf',
                s3Location: {
                  s3Bucket: 'test-bucket',
                  s3Key: 'test-key-2',
                  checksumSha256: 'test-checksum-2'
                }
              }
            ]
          }
        ]
      })

      const document = await loadPage({
        requestUrl: marineLicenceRoutes.MARINE_LICENCE_REVIEW_SITE_DETAILS,
        server: getServer()
      })

      expect(
        document.querySelector('#construction-drawing-site-1-1')
      ).not.toBeNull()
      expect(
        document.querySelector('#construction-drawing-site-1-2')
      ).not.toBeNull()

      const firstCardDeleteLink = document
        .querySelector('#construction-drawing-site-1-1')
        .querySelector('a[href*="delete-construction-drawing"]')
      const secondCardDeleteLink = document
        .querySelector('#construction-drawing-site-1-2')
        .querySelector('a[href*="delete-construction-drawing"]')

      expect(firstCardDeleteLink).toBeNull()
      expect(secondCardDeleteLink).toHaveAttribute(
        'href',
        'delete-construction-drawing?site=1&drawing=2'
      )
    })
  })

  describe('manual coordinates journey', () => {
    test('renders drawing cards and the "Add another" button after the activity cards, in the correct order', async () => {
      mockMarineLicence({
        ...mockMarineLicenceApplication,
        siteDetails: [
          {
            coordinatesType: 'coordinates',
            coordinatesEntry: 'single',
            coordinateSystem: 'wgs84',
            coordinates: { latitude: '55.123456', longitude: '55.123456' },
            circleWidth: '100',
            siteName: 'Manual Test Site',
            activityDetails: [
              {
                activityType: 'construction',
                activitySubType: 'construction-type-1'
              }
            ]
          }
        ]
      })

      const document = await loadPage({
        requestUrl: marineLicenceRoutes.MARINE_LICENCE_REVIEW_SITE_DETAILS,
        server: getServer()
      })

      expect(getCardOrder(document)).toEqual([
        'activity-details-site-1-activity-1',
        'add-another-activity-site-1',
        'construction-drawing-site-1-1',
        'add-another-construction-drawing-site-1'
      ])
    })
  })
})
