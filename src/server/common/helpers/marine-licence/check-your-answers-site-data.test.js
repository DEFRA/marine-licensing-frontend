import { vi } from 'vitest'
import { getMarineLicenceService } from '#src/services/marine-licence-service/index.js'
import { getSiteDetailsBySite } from '#src/server/common/helpers/marine-licence/session-cache/site-details-utils.js'
import { buildManualCoordinateSummaryData } from '#src/server/common/helpers/review-site-details/manual-entry.js'
import { getFileUploadSummaryData } from '#src/server/common/helpers/review-site-details/file-upload.js'
import { createSiteDetailsDataJson } from '#src/server/common/helpers/site-details.js'
import { parseActivityDetails } from '#src/server/common/helpers/review-site-details/activity-details.js'
import { buildCheckYourAnswersSiteData } from '#src/server/common/helpers/marine-licence/check-your-answers-site-data.js'
import {
  mockFileUploadMarineLicence,
  mockManualCoordinatesMarineLicence
} from '~/src/server/test-helpers/mocks/marine-licence-mocks.js'

vi.mock('#src/services/marine-licence-service/index.js')
vi.mock(
  '#src/server/common/helpers/marine-licence/session-cache/site-details-utils.js'
)
vi.mock('#src/server/common/helpers/review-site-details/manual-entry.js')
vi.mock('#src/server/common/helpers/review-site-details/file-upload.js')
vi.mock('#src/server/common/helpers/site-details.js')
vi.mock('#src/server/common/helpers/review-site-details/activity-details.js')

describe('#buildCheckYourAnswersSiteData', () => {
  const mockRequest = { yar: {} }
  const mockGetMarineLicenceById = vi.fn()

  beforeEach(() => {
    vi.mocked(getMarineLicenceService).mockReturnValue({
      getMarineLicenceById: mockGetMarineLicenceById
    })
  })

  test('returns empty data when marineLicence has no id', async () => {
    const result = await buildCheckYourAnswersSiteData({}, mockRequest)

    expect(getMarineLicenceService).not.toHaveBeenCalled()
    expect(result).toEqual({ coordinatesType: null, summaryData: [] })
  })

  test('returns empty data when completeMarineLicence has no siteDetails', async () => {
    mockGetMarineLicenceById.mockResolvedValue({ id: '123' })

    const result = await buildCheckYourAnswersSiteData(
      { id: '123' },
      mockRequest
    )

    expect(mockGetMarineLicenceById).toHaveBeenCalledWith('123')
    expect(result).toEqual({ coordinatesType: null, summaryData: [] })
  })

  test('returns empty data when siteDetails is an empty array', async () => {
    mockGetMarineLicenceById.mockResolvedValue({ id: '123', siteDetails: [] })

    const result = await buildCheckYourAnswersSiteData(
      { id: '123' },
      mockRequest
    )

    expect(result).toEqual({ coordinatesType: null, summaryData: [] })
  })

  test('returns file upload summary data when coordinatesType is file', async () => {
    mockGetMarineLicenceById.mockResolvedValue(mockFileUploadMarineLicence)
    vi.mocked(getSiteDetailsBySite).mockReturnValue({ coordinatesType: 'file' })
    vi.mocked(getFileUploadSummaryData).mockReturnValue({ coordinates: [] })
    vi.mocked(createSiteDetailsDataJson).mockReturnValue('{}')
    vi.mocked(parseActivityDetails).mockReturnValue([])

    const result = await buildCheckYourAnswersSiteData(
      { id: mockFileUploadMarineLicence.id },
      mockRequest
    )

    expect(mockGetMarineLicenceById).toHaveBeenCalledWith(
      mockFileUploadMarineLicence.id
    )
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

  test('returns manual coordinate summary data when coordinatesType is coordinates', async () => {
    const mockManualSummaryData = [
      { siteNumber: 1, siteName: 'Test site name' }
    ]
    mockGetMarineLicenceById.mockResolvedValue(
      mockManualCoordinatesMarineLicence
    )
    vi.mocked(getSiteDetailsBySite).mockReturnValue({
      coordinatesType: 'coordinates'
    })
    vi.mocked(buildManualCoordinateSummaryData).mockReturnValue(
      mockManualSummaryData
    )

    const result = await buildCheckYourAnswersSiteData(
      { id: mockManualCoordinatesMarineLicence.id },
      mockRequest
    )

    expect(buildManualCoordinateSummaryData).toHaveBeenCalledWith(
      mockManualCoordinatesMarineLicence.siteDetails,
      {}
    )
    expect(result).toEqual({
      coordinatesType: 'coordinates',
      summaryData: mockManualSummaryData
    })
  })

  test('returns empty data when coordinatesType is unrecognised', async () => {
    mockGetMarineLicenceById.mockResolvedValue(
      mockManualCoordinatesMarineLicence
    )
    vi.mocked(getSiteDetailsBySite).mockReturnValue({
      coordinatesType: 'unknown'
    })

    const result = await buildCheckYourAnswersSiteData(
      { id: mockManualCoordinatesMarineLicence.id },
      mockRequest
    )

    expect(result).toEqual({ coordinatesType: null, summaryData: [] })
  })
})
