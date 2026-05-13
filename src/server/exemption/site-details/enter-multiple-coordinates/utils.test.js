import { vi } from 'vitest'
import { COORDINATE_SYSTEMS } from '#src/server/common/constants/coordinate-systems.js'
import { routes } from '#src/server/common/constants/routes.js'
import { generatePointSpecificErrorMessage } from '#src/server/common/helpers/site-details.js'
import {
  multipleCoordinatesPageData,
  MULTIPLE_COORDINATES_VIEW_ROUTES,
  handleValidationFailure
} from './utils.js'

vi.mock('#src/server/common/helpers/site-details.js')

describe('enter-multiple-coordinates utils (exemptions)', () => {
  describe('multipleCoordinatesPageData', () => {
    it('should provide correct page data', () => {
      expect(multipleCoordinatesPageData).toEqual({
        heading:
          'Enter multiple sets of coordinates to mark the boundary of the site',
        pageTitle:
          'Enter multiple sets of coordinates to mark the boundary of the site',
        backLink: routes.COORDINATE_SYSTEM_CHOICE,
        cancelLink: '/exemption/task-list?cancel=site-details'
      })
    })
  })

  describe('handleValidationFailure', () => {
    const mockCoordinates = [{ latitude: '51.5074', longitude: '-0.1278' }]
    const mockTakeover = vi.fn()
    const mockH = {
      view: vi.fn().mockReturnValue({ takeover: mockTakeover })
    }

    beforeEach(() => {
      vi.clearAllMocks()
      mockH.view.mockReturnValue({ takeover: mockTakeover })
      generatePointSpecificErrorMessage.mockImplementation(
        (message, index) => `Point ${index + 1}: ${message}`
      )
    })

    it('should handle validation failure with error details', () => {
      const error = {
        details: [
          { path: ['coordinates0latitude'], message: 'Field is required' }
        ]
      }

      handleValidationFailure(
        mockH,
        error,
        COORDINATE_SYSTEMS.WGS84,
        mockCoordinates,
        'Test Project',
        multipleCoordinatesPageData
      )

      expect(mockH.view).toHaveBeenCalledWith(
        MULTIPLE_COORDINATES_VIEW_ROUTES[COORDINATE_SYSTEMS.WGS84],
        expect.objectContaining({
          coordinates: mockCoordinates,
          errorSummary: [
            {
              href: '#coordinates-0-latitude',
              text: 'Point 1: Field is required'
            }
          ],
          errors: {
            coordinates0latitude: { text: 'Point 1: Field is required' }
          },
          projectName: 'Test Project'
        })
      )
    })

    it('should handle validation failure without error details', () => {
      const error = { message: 'General error' }

      handleValidationFailure(
        mockH,
        error,
        COORDINATE_SYSTEMS.WGS84,
        mockCoordinates,
        'Test Project',
        multipleCoordinatesPageData
      )

      expect(mockH.view).toHaveBeenCalledWith(
        MULTIPLE_COORDINATES_VIEW_ROUTES[COORDINATE_SYSTEMS.WGS84],
        expect.objectContaining({
          coordinates: mockCoordinates,
          projectName: 'Test Project'
        })
      )
    })
  })
})
