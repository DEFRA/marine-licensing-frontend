import { vi } from 'vitest'
import {
  buildUploadSiteData,
  buildUploadedSiteDetails,
  createSiteDetailsBatchUpdater,
  updateCachedSiteDetailsBatch
} from '#src/server/common/helpers/file-upload/build-uploaded-site-details.js'

const mockStatus = {
  filename: 'test-file',
  status: 'ready',
  s3Location: {
    s3Bucket: 'status-bucket',
    s3Key: 'status-key',
    fileId: 'file-id',
    s3Url: 'https://example.test/file',
    checksumSha256: 'checksum'
  }
}

const mockS3Location = {
  s3Bucket: 'upload-bucket',
  s3Key: 'upload-key'
}

const namedFeature = (name) => ({
  type: 'Feature',
  geometry: { type: 'Polygon', coordinates: [] },
  properties: name ? { name } : {}
})

describe('#buildUploadSiteData', () => {
  test('copies coordinates type, file type and S3 metadata from the upload', () => {
    expect(
      buildUploadSiteData({
        status: mockStatus,
        s3Location: mockS3Location,
        siteDetails: { coordinatesType: 'file', fileUploadType: 'kml' }
      })
    ).toEqual({
      coordinatesType: 'file',
      fileUploadType: 'kml',
      uploadedFile: mockStatus,
      s3Location: {
        s3Bucket: 'upload-bucket',
        s3Key: 'upload-key',
        fileId: 'file-id',
        s3Url: 'https://example.test/file',
        checksumSha256: 'checksum'
      },
      featureCount: 1,
      uploadConfig: null
    })
  })
})

describe('#buildUploadedSiteDetails', () => {
  const uploadSiteData = {
    coordinatesType: 'file',
    fileUploadType: 'kml',
    featureCount: 1,
    uploadConfig: null
  }

  test('builds a single site from the full GeoJSON and extracted site name', () => {
    const geoJSON = {
      type: 'FeatureCollection',
      features: [namedFeature('North Harbour')]
    }

    const result = buildUploadedSiteDetails({
      existingCache: {},
      uploadSiteData,
      coordinateData: { extractedCoordinates: [[0, 0]], geoJSON },
      isMultipleSitesFile: false,
      getSiteDetails: () => ({})
    })

    expect(result).toEqual([
      {
        ...uploadSiteData,
        extractedCoordinates: [[0, 0]],
        geoJSON,
        siteName: 'North Harbour'
      }
    ])
  })

  test('builds one site per feature and looks up existing details by index', () => {
    const features = [namedFeature('East Pier'), namedFeature()]
    const getSiteDetails = (cache, index) => cache.siteDetails[index]
    const existingCache = {
      siteDetails: [{ siteName: 'Existing A' }, { siteName: 'Existing B' }]
    }

    const result = buildUploadedSiteDetails({
      existingCache,
      uploadSiteData,
      coordinateData: {
        extractedCoordinates: [[[1, 1]], [[2, 2]]],
        geoJSON: { type: 'FeatureCollection', features }
      },
      isMultipleSitesFile: true,
      getSiteDetails
    })

    expect(result).toEqual([
      {
        siteName: 'East Pier',
        ...uploadSiteData,
        extractedCoordinates: [[1, 1]],
        geoJSON: { type: 'FeatureCollection', features: [features[0]] }
      },
      {
        ...uploadSiteData,
        extractedCoordinates: [[2, 2]],
        geoJSON: { type: 'FeatureCollection', features: [features[1]] }
      }
    ])
  })
})

describe('#updateCachedSiteDetailsBatch', () => {
  test('writes built site details to the given cache key', () => {
    const existingCache = {
      projectName: 'Test Project',
      siteDetails: [{ coordinatesType: 'file', fileUploadType: 'kml' }]
    }
    const mockRequest = {
      yar: {
        get: vi.fn().mockReturnValue(existingCache),
        set: vi.fn()
      }
    }
    const geoJSON = {
      type: 'FeatureCollection',
      features: [namedFeature('North Harbour')]
    }

    const result = updateCachedSiteDetailsBatch(
      mockRequest,
      mockStatus,
      { extractedCoordinates: [[0, 0]], geoJSON },
      mockS3Location,
      {
        isMultipleSitesFile: false,
        cacheKey: 'exemption',
        getCache: () => existingCache,
        getSiteDetails: () => existingCache.siteDetails[0]
      }
    )

    expect(result[0].siteName).toBe('North Harbour')
    expect(mockRequest.yar.set).toHaveBeenCalledWith('exemption', {
      projectName: 'Test Project',
      siteDetails: result
    })
  })
})

describe('#createSiteDetailsBatchUpdater', () => {
  test('returns a function that writes to the configured cache key', () => {
    const existingCache = {
      siteDetails: [{ coordinatesType: 'file', fileUploadType: 'kml' }]
    }
    const mockRequest = {
      yar: { set: vi.fn() }
    }
    const updateSiteDetailsBatch = createSiteDetailsBatchUpdater({
      cacheKey: 'marineLicence',
      getCache: () => existingCache,
      getSiteDetails: () => existingCache.siteDetails[0]
    })

    const result = updateSiteDetailsBatch(
      mockRequest,
      mockStatus,
      {
        extractedCoordinates: [[0, 0]],
        geoJSON: {
          type: 'FeatureCollection',
          features: [namedFeature('Pier')]
        }
      },
      mockS3Location,
      { isMultipleSitesFile: false }
    )

    expect(result[0].siteName).toBe('Pier')
    expect(mockRequest.yar.set).toHaveBeenCalledWith('marineLicence', {
      siteDetails: result
    })
  })
})
