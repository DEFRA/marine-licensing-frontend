import { vi } from 'vitest'
import {
  clearActivityData,
  copySameActivityDatesToAllSites,
  copySameActivityDescriptionToAllSites
} from './copy-same-activity-data.js'
import * as cacheUtils from '#src/server/common/helpers/session-cache/utils.js'

vi.mock('~/src/server/common/helpers/session-cache/utils.js')

describe('copy-same-activity-data', () => {
  const mockRequest = {}
  const mockH = {}

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(cacheUtils.updateExemptionSiteDetails).mockResolvedValue({})
  })

  describe('copySameActivityDatesToAllSites', () => {
    test('should copy activity dates from first site to all other sites', async () => {
      const mockExemption = {
        siteDetails: [
          { activityDates: { start: '2024-01-01', end: '2024-12-31' } },
          { activityDates: null },
          { activityDates: null }
        ]
      }

      vi.mocked(cacheUtils.getExemptionCache).mockReturnValue(mockExemption)

      await copySameActivityDatesToAllSites(mockRequest, mockH)

      expect(cacheUtils.updateExemptionSiteDetails).toHaveBeenCalledTimes(2)
      expect(cacheUtils.updateExemptionSiteDetails).toHaveBeenCalledWith(
        mockRequest,
        mockH,
        1,
        'activityDates',
        { start: '2024-01-01', end: '2024-12-31' }
      )
      expect(cacheUtils.updateExemptionSiteDetails).toHaveBeenCalledWith(
        mockRequest,
        mockH,
        2,
        'activityDates',
        { start: '2024-01-01', end: '2024-12-31' }
      )
    })

    test('should handle single site without copying', async () => {
      const mockExemption = {
        siteDetails: [
          { activityDates: { start: '2024-01-01', end: '2024-12-31' } }
        ]
      }

      vi.mocked(cacheUtils.getExemptionCache).mockReturnValue(mockExemption)

      await copySameActivityDatesToAllSites(mockRequest, mockH)

      expect(cacheUtils.updateExemptionSiteDetails).not.toHaveBeenCalled()
    })

    test('should handle missing first site dates gracefully', async () => {
      const mockExemption = {
        siteDetails: [{ activityDates: null }, { activityDates: null }]
      }

      vi.mocked(cacheUtils.getExemptionCache).mockReturnValue(mockExemption)

      await copySameActivityDatesToAllSites(mockRequest, mockH)

      expect(cacheUtils.updateExemptionSiteDetails).not.toHaveBeenCalled()
    })

    test('should copy dates to multiple sites correctly', async () => {
      const mockExemption = {
        siteDetails: [
          { activityDates: { start: '2024-01-01', end: '2024-12-31' } },
          { activityDates: { start: '2023-01-01', end: '2023-12-31' } },
          { activityDates: null },
          { activityDates: { start: '2022-01-01', end: '2022-12-31' } }
        ]
      }

      vi.mocked(cacheUtils.getExemptionCache).mockReturnValue(mockExemption)

      await copySameActivityDatesToAllSites(mockRequest, mockH)

      expect(cacheUtils.updateExemptionSiteDetails).toHaveBeenCalledTimes(3)
      expect(cacheUtils.updateExemptionSiteDetails).toHaveBeenNthCalledWith(
        1,
        mockRequest,
        mockH,
        1,
        'activityDates',
        { start: '2024-01-01', end: '2024-12-31' }
      )
      expect(cacheUtils.updateExemptionSiteDetails).toHaveBeenNthCalledWith(
        2,
        mockRequest,
        mockH,
        2,
        'activityDates',
        { start: '2024-01-01', end: '2024-12-31' }
      )
      expect(cacheUtils.updateExemptionSiteDetails).toHaveBeenNthCalledWith(
        3,
        mockRequest,
        mockH,
        3,
        'activityDates',
        { start: '2024-01-01', end: '2024-12-31' }
      )
    })
  })

  describe('copySameActivityDescriptionToAllSites', () => {
    test('should copy activity description from first site to all other sites', async () => {
      const mockExemption = {
        siteDetails: [
          { activityDescription: 'Shared description' },
          { activityDescription: null },
          { activityDescription: null }
        ]
      }

      vi.mocked(cacheUtils.getExemptionCache).mockReturnValue(mockExemption)

      await copySameActivityDescriptionToAllSites(mockRequest, mockH)

      expect(cacheUtils.updateExemptionSiteDetails).toHaveBeenCalledTimes(2)
      expect(cacheUtils.updateExemptionSiteDetails).toHaveBeenCalledWith(
        mockRequest,
        mockH,
        1,
        'activityDescription',
        'Shared description'
      )
      expect(cacheUtils.updateExemptionSiteDetails).toHaveBeenCalledWith(
        mockRequest,
        mockH,
        2,
        'activityDescription',
        'Shared description'
      )
    })

    test('should handle single site without copying', async () => {
      const mockExemption = {
        siteDetails: [{ activityDescription: 'Shared description' }]
      }

      vi.mocked(cacheUtils.getExemptionCache).mockReturnValue(mockExemption)

      await copySameActivityDescriptionToAllSites(mockRequest, mockH)

      expect(cacheUtils.updateExemptionSiteDetails).not.toHaveBeenCalled()
    })

    test('should handle missing first site description gracefully', async () => {
      const mockExemption = {
        siteDetails: [
          { activityDescription: null },
          { activityDescription: null }
        ]
      }

      vi.mocked(cacheUtils.getExemptionCache).mockReturnValue(mockExemption)

      await copySameActivityDescriptionToAllSites(mockRequest, mockH)

      expect(cacheUtils.updateExemptionSiteDetails).not.toHaveBeenCalled()
    })

    test('should handle empty first site gracefully', async () => {
      const mockExemption = {
        siteDetails: [undefined, { activityDescription: null }]
      }

      vi.mocked(cacheUtils.getExemptionCache).mockReturnValue(mockExemption)

      await copySameActivityDescriptionToAllSites(mockRequest, mockH)

      expect(cacheUtils.updateExemptionSiteDetails).not.toHaveBeenCalled()
    })

    test('should copy description to multiple sites correctly', async () => {
      const mockExemption = {
        siteDetails: [
          { activityDescription: 'New description' },
          { activityDescription: 'Old description 1' },
          { activityDescription: null },
          { activityDescription: 'Old description 2' }
        ]
      }

      vi.mocked(cacheUtils.getExemptionCache).mockReturnValue(mockExemption)

      await copySameActivityDescriptionToAllSites(mockRequest, mockH)

      expect(cacheUtils.updateExemptionSiteDetails).toHaveBeenCalledTimes(3)
      expect(cacheUtils.updateExemptionSiteDetails).toHaveBeenNthCalledWith(
        1,
        mockRequest,
        mockH,
        1,
        'activityDescription',
        'New description'
      )
      expect(cacheUtils.updateExemptionSiteDetails).toHaveBeenNthCalledWith(
        2,
        mockRequest,
        mockH,
        2,
        'activityDescription',
        'New description'
      )
      expect(cacheUtils.updateExemptionSiteDetails).toHaveBeenNthCalledWith(
        3,
        mockRequest,
        mockH,
        3,
        'activityDescription',
        'New description'
      )
    })
  })

  describe('clearActivityData', () => {
    test('should clear data for all sites', () => {
      const mockExemption = {
        siteDetails: [{}]
      }

      vi.mocked(cacheUtils.getExemptionCache).mockReturnValue(mockExemption)

      clearActivityData(mockRequest, 'activityDates')

      expect(cacheUtils.updateExemptionSiteDetails).toHaveBeenCalledWith(
        {},
        0,
        'activityDates',
        null
      )
    })
  })
})
