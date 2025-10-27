import { vi } from 'vitest'
import {
  copySameActivityDatesToAllSites,
  copySameActivityDescriptionToAllSites
} from './copy-same-activity-data.js'
import * as cacheUtils from '#src/server/common/helpers/session-cache/utils.js'

vi.mock('~/src/server/common/helpers/session-cache/utils.js')

describe('copy-same-activity-data', () => {
  const mockRequest = {}

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('copySameActivityDatesToAllSites', () => {
    test('should copy activity dates from first site to all other sites', () => {
      const mockExemption = {
        siteDetails: [
          { activityDates: { start: '2024-01-01', end: '2024-12-31' } },
          { activityDates: null },
          { activityDates: null }
        ]
      }

      vi.mocked(cacheUtils.getExemptionCache).mockReturnValue(mockExemption)

      copySameActivityDatesToAllSites(mockRequest)

      expect(cacheUtils.updateExemptionSiteDetails).toHaveBeenCalledTimes(2)
      expect(cacheUtils.updateExemptionSiteDetails).toHaveBeenCalledWith(
        mockRequest,
        1,
        'activityDates',
        { start: '2024-01-01', end: '2024-12-31' }
      )
      expect(cacheUtils.updateExemptionSiteDetails).toHaveBeenCalledWith(
        mockRequest,
        2,
        'activityDates',
        { start: '2024-01-01', end: '2024-12-31' }
      )
    })

    test('should handle single site without copying', () => {
      const mockExemption = {
        siteDetails: [
          { activityDates: { start: '2024-01-01', end: '2024-12-31' } }
        ]
      }

      vi.mocked(cacheUtils.getExemptionCache).mockReturnValue(mockExemption)

      copySameActivityDatesToAllSites(mockRequest)

      expect(cacheUtils.updateExemptionSiteDetails).not.toHaveBeenCalled()
    })

    test('should handle missing first site dates gracefully', () => {
      const mockExemption = {
        siteDetails: [{ activityDates: null }, { activityDates: null }]
      }

      vi.mocked(cacheUtils.getExemptionCache).mockReturnValue(mockExemption)

      copySameActivityDatesToAllSites(mockRequest)

      expect(cacheUtils.updateExemptionSiteDetails).not.toHaveBeenCalled()
    })

    test('should copy dates to multiple sites correctly', () => {
      const mockExemption = {
        siteDetails: [
          { activityDates: { start: '2024-01-01', end: '2024-12-31' } },
          { activityDates: { start: '2023-01-01', end: '2023-12-31' } },
          { activityDates: null },
          { activityDates: { start: '2022-01-01', end: '2022-12-31' } }
        ]
      }

      vi.mocked(cacheUtils.getExemptionCache).mockReturnValue(mockExemption)

      copySameActivityDatesToAllSites(mockRequest)

      expect(cacheUtils.updateExemptionSiteDetails).toHaveBeenCalledTimes(3)
      expect(cacheUtils.updateExemptionSiteDetails).toHaveBeenNthCalledWith(
        1,
        mockRequest,
        1,
        'activityDates',
        { start: '2024-01-01', end: '2024-12-31' }
      )
      expect(cacheUtils.updateExemptionSiteDetails).toHaveBeenNthCalledWith(
        2,
        mockRequest,
        2,
        'activityDates',
        { start: '2024-01-01', end: '2024-12-31' }
      )
      expect(cacheUtils.updateExemptionSiteDetails).toHaveBeenNthCalledWith(
        3,
        mockRequest,
        3,
        'activityDates',
        { start: '2024-01-01', end: '2024-12-31' }
      )
    })
  })

  describe('copySameActivityDescriptionToAllSites', () => {
    test('should copy activity description from first site to all other sites', () => {
      const mockExemption = {
        siteDetails: [
          { activityDescription: 'Shared description' },
          { activityDescription: null },
          { activityDescription: null }
        ]
      }

      vi.mocked(cacheUtils.getExemptionCache).mockReturnValue(mockExemption)

      copySameActivityDescriptionToAllSites(mockRequest)

      expect(cacheUtils.updateExemptionSiteDetails).toHaveBeenCalledTimes(2)
      expect(cacheUtils.updateExemptionSiteDetails).toHaveBeenCalledWith(
        mockRequest,
        1,
        'activityDescription',
        'Shared description'
      )
      expect(cacheUtils.updateExemptionSiteDetails).toHaveBeenCalledWith(
        mockRequest,
        2,
        'activityDescription',
        'Shared description'
      )
    })

    test('should handle single site without copying', () => {
      const mockExemption = {
        siteDetails: [{ activityDescription: 'Shared description' }]
      }

      vi.mocked(cacheUtils.getExemptionCache).mockReturnValue(mockExemption)

      copySameActivityDescriptionToAllSites(mockRequest)

      expect(cacheUtils.updateExemptionSiteDetails).not.toHaveBeenCalled()
    })

    test('should handle missing first site description gracefully', () => {
      const mockExemption = {
        siteDetails: [
          { activityDescription: null },
          { activityDescription: null }
        ]
      }

      vi.mocked(cacheUtils.getExemptionCache).mockReturnValue(mockExemption)

      copySameActivityDescriptionToAllSites(mockRequest)

      expect(cacheUtils.updateExemptionSiteDetails).not.toHaveBeenCalled()
    })

    test('should handle empty first site gracefully', () => {
      const mockExemption = {
        siteDetails: [undefined, { activityDescription: null }]
      }

      vi.mocked(cacheUtils.getExemptionCache).mockReturnValue(mockExemption)

      copySameActivityDescriptionToAllSites(mockRequest)

      expect(cacheUtils.updateExemptionSiteDetails).not.toHaveBeenCalled()
    })

    test('should copy description to multiple sites correctly', () => {
      const mockExemption = {
        siteDetails: [
          { activityDescription: 'New description' },
          { activityDescription: 'Old description 1' },
          { activityDescription: null },
          { activityDescription: 'Old description 2' }
        ]
      }

      vi.mocked(cacheUtils.getExemptionCache).mockReturnValue(mockExemption)

      copySameActivityDescriptionToAllSites(mockRequest)

      expect(cacheUtils.updateExemptionSiteDetails).toHaveBeenCalledTimes(3)
      expect(cacheUtils.updateExemptionSiteDetails).toHaveBeenNthCalledWith(
        1,
        mockRequest,
        1,
        'activityDescription',
        'New description'
      )
      expect(cacheUtils.updateExemptionSiteDetails).toHaveBeenNthCalledWith(
        2,
        mockRequest,
        2,
        'activityDescription',
        'New description'
      )
      expect(cacheUtils.updateExemptionSiteDetails).toHaveBeenNthCalledWith(
        3,
        mockRequest,
        3,
        'activityDescription',
        'New description'
      )
    })
  })
})
