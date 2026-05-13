import { vi } from 'vitest'
import { COORDINATE_SYSTEMS } from '#src/server/common/constants/coordinate-systems.js'
import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'
import { generatePointSpecificErrorMessage } from '#src/server/common/helpers/site-details.js'
import {
  multipleCoordinatesPageData,
  MULTIPLE_COORDINATES_VIEW_ROUTES,
  handleValidationFailure,
  isWGS84
} from './utils.js'

vi.mock('#src/server/common/helpers/site-details.js')

describe('enter-multiple-coordinates utils (marine licence)', () => {
  describe('multipleCoordinatesPageData', () => {
    test('should use marine licence coordinate system choice as back link', () => {
      expect(multipleCoordinatesPageData.backLink).toBe(
        marineLicenceRoutes.MARINE_LICENCE_COORDINATE_SYSTEM_CHOICE
      )
    })

    test('should use marine licence task list cancel link', () => {
      expect(multipleCoordinatesPageData.cancelLink).toBe(
        marineLicenceRoutes.MARINE_LICENCE_TASK_LIST + '?cancel=site-details'
      )
    })
  })

  describe('isWGS84', () => {
    test('returns true for WGS84', () => {
      expect(isWGS84(COORDINATE_SYSTEMS.WGS84)).toBe(true)
    })

    test('returns false for OSGB36', () => {
      expect(isWGS84(COORDINATE_SYSTEMS.OSGB36)).toBe(false)
    })
  })

  describe('handleValidationFailure', () => {
    const mockCoordinates = [{ latitude: '51.5074', longitude: '-0.1278' }]
    const mockTakeover = vi.fn()
    const mockH = {
      view: vi.fn().mockReturnValue({ takeover: mockTakeover })
    }

    beforeEach(() => {
      mockH.view.mockClear()
      mockTakeover.mockClear()
      mockH.view.mockReturnValue({ takeover: mockTakeover })
      vi.mocked(generatePointSpecificErrorMessage).mockReturnValue(
        'Enter latitude'
      )
    })

    test('renders view with errors when error has details', () => {
      const error = {
        details: [{ path: ['coordinates0latitude'], message: 'bad value' }]
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
          errorSummary: expect.any(Array),
          errors: expect.any(Object),
          projectName: 'Test Project'
        })
      )
      expect(mockTakeover).toHaveBeenCalled()
    })

    test('renders view without errors when error has no details', () => {
      const error = { message: 'generic error' }

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
        expect.not.objectContaining({ errorSummary: expect.anything() })
      )
      expect(mockTakeover).toHaveBeenCalled()
    })
  })
})
