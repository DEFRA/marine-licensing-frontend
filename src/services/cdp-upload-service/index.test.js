import {
  getCdpUploadService,
  CdpUploadService,
  UPLOAD_STATUSES
} from './index.js'

describe('#CDP Upload Service Index', () => {
  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('getCdpUploadService factory function', () => {
    test('Should create a CdpUploadService instance with no MIME types when called with no arguments', () => {
      // Given / When
      const service = getCdpUploadService()

      // Then
      expect(service).toBeInstanceOf(CdpUploadService)
      expect(service.allowedMimeTypes).toBeNull()
    })

    test('Should create a CdpUploadService instance with no MIME types when called with null', () => {
      // Given / When
      const service = getCdpUploadService(null)

      // Then
      expect(service).toBeInstanceOf(CdpUploadService)
      expect(service.allowedMimeTypes).toBeNull()
    })

    test('Should create a CdpUploadService instance with provided MIME types', () => {
      // Given
      const allowedMimeTypes = [
        'application/vnd.google-earth.kml+xml',
        'application/zip'
      ]

      // When
      const service = getCdpUploadService(allowedMimeTypes)

      // Then
      expect(service).toBeInstanceOf(CdpUploadService)
      expect(service.allowedMimeTypes).toEqual(allowedMimeTypes)
    })

    test('Should create a new instance each time it is called', () => {
      // Given / When
      const service1 = getCdpUploadService()
      const service2 = getCdpUploadService()

      // Then
      expect(service1).toBeInstanceOf(CdpUploadService)
      expect(service2).toBeInstanceOf(CdpUploadService)
      expect(service1).not.toBe(service2) // Different instances
    })
  })

  describe('Re-exports', () => {
    test('Should re-export CdpUploadService class', () => {
      // Given / When / Then
      expect(CdpUploadService).toBeDefined()
      expect(typeof CdpUploadService).toBe('function')
      expect(CdpUploadService.name).toBe('CdpUploadService')
    })

    test('Should re-export UPLOAD_STATUSES constants', () => {
      // Given / When / Then
      expect(UPLOAD_STATUSES).toBeDefined()
      expect(typeof UPLOAD_STATUSES).toBe('object')

      // Verify it contains expected status constants
      expect(UPLOAD_STATUSES.INITIATED).toBe('initiated')
      expect(UPLOAD_STATUSES.PENDING).toBe('pending')
      expect(UPLOAD_STATUSES.READY).toBe('ready')
      expect(UPLOAD_STATUSES.COMPLETE).toBe('complete')
      expect(UPLOAD_STATUSES.REJECTED).toBe('rejected')
      expect(UPLOAD_STATUSES.ERROR).toBe('error')
    })
  })

  describe('ML-70 Integration scenarios', () => {
    test('Should create service for KML file uploads', () => {
      // Given - KML coordinates as per ML-70 requirements
      const kmlMimeTypes = ['application/vnd.google-earth.kml+xml']

      // When
      const service = getCdpUploadService(kmlMimeTypes)

      // Then
      expect(service.allowedMimeTypes).toEqual(kmlMimeTypes)
    })

    test('Should create service for Shapefile uploads', () => {
      // Given - Shapefile (ZIP) as per ML-70 requirements
      const shapefileMimeTypes = ['application/zip']

      // When
      const service = getCdpUploadService(shapefileMimeTypes)

      // Then
      expect(service.allowedMimeTypes).toEqual(shapefileMimeTypes)
    })

    test('Should create service supporting both coordinate file types', () => {
      // Given - Both KML and Shapefile support as per ML-70
      const bothMimeTypes = [
        'application/vnd.google-earth.kml+xml',
        'application/zip'
      ]

      // When
      const service = getCdpUploadService(bothMimeTypes)

      // Then
      expect(service.allowedMimeTypes).toEqual(bothMimeTypes)
    })

    test('Should create service with no restrictions for flexible upload', () => {
      // Given - No restrictions for maximum flexibility

      // When
      const service = getCdpUploadService()

      // Then
      expect(service.allowedMimeTypes).toBeNull()
    })
  })
})
