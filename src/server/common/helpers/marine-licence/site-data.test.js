import { vi } from 'vitest'
import { getSiteDetailsBySite } from '#src/server/common/helpers/marine-licence/session-cache/site-details-utils.js'
import { buildManualCoordinateSummaryData } from '#src/server/common/helpers/review-site-details/manual-entry.js'
import { getFileUploadSummaryData } from '#src/server/common/helpers/review-site-details/file-upload.js'
import { createSiteDetailsDataJson } from '#src/server/common/helpers/site-details.js'
import { parseActivityDetails } from '#src/server/common/helpers/review-site-details/activity-details.js'
import { buildSiteData } from '#src/server/common/helpers/marine-licence/site-data.js'
import {
  mockFileUploadMarineLicence,
  mockManualCoordinatesMarineLicence
} from '~/src/server/test-helpers/mocks/marine-licence-mocks.js'

vi.mock(
  '#src/server/common/helpers/marine-licence/session-cache/site-details-utils.js'
)
vi.mock('#src/server/common/helpers/review-site-details/manual-entry.js')
vi.mock('#src/server/common/helpers/review-site-details/file-upload.js')
vi.mock('#src/server/common/helpers/site-details.js')
vi.mock('#src/server/common/helpers/review-site-details/activity-details.js')

describe('#buildSiteData', () => {
  test.each([
    ['no siteDetails key', { id: '123' }],
    ['empty siteDetails array', { id: '123', siteDetails: [] }]
  ])('returns empty data when marine licence has %s', (_, marineLicence) => {
    const result = buildSiteData(marineLicence)

    expect(result).toEqual({ coordinatesType: null, summaryData: [] })
  })

  test('returns file upload summary data when coordinatesType is file', () => {
    vi.mocked(getSiteDetailsBySite).mockReturnValue({ coordinatesType: 'file' })
    vi.mocked(getFileUploadSummaryData).mockReturnValue({ coordinates: [] })
    vi.mocked(createSiteDetailsDataJson).mockReturnValue('{}')
    vi.mocked(parseActivityDetails).mockReturnValue([])

    const result = buildSiteData(mockFileUploadMarineLicence)

    expect(getSiteDetailsBySite).toHaveBeenCalledWith(
      mockFileUploadMarineLicence
    )
    expect(result.coordinatesType).toBe('file')
    expect(result.summaryData).toHaveLength(
      mockFileUploadMarineLicence.siteDetails.length
    )
    expect(result.summaryData[0]).toEqual(
      expect.objectContaining({
        siteNumber: 1,
        siteName: mockFileUploadMarineLicence.siteDetails[0].siteName,
        siteDetailsData: '{}',
        activityDetails: []
      })
    )
  })

  test('returns manual coordinate summary data when coordinatesType is coordinates', () => {
    const mockManualSummaryData = [
      { siteNumber: 1, siteName: 'Test site name' }
    ]
    vi.mocked(getSiteDetailsBySite).mockReturnValue({
      coordinatesType: 'coordinates'
    })
    vi.mocked(buildManualCoordinateSummaryData).mockReturnValue(
      mockManualSummaryData
    )

    const result = buildSiteData(mockManualCoordinatesMarineLicence)

    expect(buildManualCoordinateSummaryData).toHaveBeenCalledWith(
      mockManualCoordinatesMarineLicence.siteDetails,
      {}
    )
    expect(result).toEqual({
      coordinatesType: 'coordinates',
      summaryData: mockManualSummaryData
    })
  })

  test('returns empty data when coordinatesType is unrecognised', () => {
    vi.mocked(getSiteDetailsBySite).mockReturnValue({
      coordinatesType: 'unknown'
    })

    const result = buildSiteData(mockManualCoordinatesMarineLicence)

    expect(result).toEqual({ coordinatesType: null, summaryData: [] })
  })
})
