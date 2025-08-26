import { FileValidationService } from './file-validation-service.js'

describe('FileValidationService', () => {
  let service
  let mockLogger

  beforeEach(() => {
    mockLogger = {
      debug: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn()
    }
    service = new FileValidationService(mockLogger)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('constructor', () => {
    test('should initialize with provided logger', () => {
      expect(service.logger).toBe(mockLogger)
    })
  })

  describe('validateFileExtension', () => {
    describe('valid cases', () => {
      test('should validate KML files correctly', () => {
        const result = service.validateFileExtension('coordinates.kml', ['kml'])

        expect(result.isValid).toBe(true)
        expect(result.extension).toBe('kml')
        expect(result.errorMessage).toBeNull()
      })

      test('should validate ZIP files correctly', () => {
        const result = service.validateFileExtension('shapefile.zip', ['zip'])

        expect(result.isValid).toBe(true)
        expect(result.extension).toBe('zip')
        expect(result.errorMessage).toBeNull()
      })

      test('should handle case-insensitive extensions', () => {
        const result = service.validateFileExtension('DATA.KML', ['kml'])

        expect(result.isValid).toBe(true)
        expect(result.extension).toBe('kml')
      })

      test('should handle multiple allowed extensions', () => {
        const validExtensions = ['kml', 'zip', 'csv']

        expect(
          service.validateFileExtension('data.kml', validExtensions).isValid
        ).toBe(true)
        expect(
          service.validateFileExtension('archive.zip', validExtensions).isValid
        ).toBe(true)
        expect(
          service.validateFileExtension('spreadsheet.csv', validExtensions)
            .isValid
        ).toBe(true)
      })

      test('should handle filenames with multiple dots', () => {
        const result = service.validateFileExtension(
          'my.site.coordinates.kml',
          ['kml']
        )

        expect(result.isValid).toBe(true)
        expect(result.extension).toBe('kml')
      })
    })

    describe('invalid cases', () => {
      test('should reject PDF files when only KML allowed', () => {
        const result = service.validateFileExtension('document.pdf', ['kml'])

        expect(result.isValid).toBe(false)
        expect(result.errorMessage).toBe('The selected file must be a KML file')
      })

      test('should reject TXT files when only ZIP allowed', () => {
        const result = service.validateFileExtension('readme.txt', ['zip'])

        expect(result.isValid).toBe(false)
        expect(result.errorMessage).toBe(
          'The selected file must be a Shapefile'
        )
      })

      test('should handle unknown extensions', () => {
        const result = service.validateFileExtension('data.abc', ['kml'])

        expect(result.isValid).toBe(false)
        expect(result.errorMessage).toBe('The selected file must be a KML file')
      })

      test('should reject files with no extension', () => {
        const result = service.validateFileExtension('filename', ['kml'])

        expect(result.isValid).toBe(false)
        expect(result.extension).toBe('')
      })

      test('should reject files ending with dot', () => {
        const result = service.validateFileExtension('filename.', ['kml'])

        expect(result.isValid).toBe(false)
        expect(result.extension).toBe('')
      })
    })

    describe('input validation', () => {
      test('should handle null filename', () => {
        const result = service.validateFileExtension(null, ['kml'])

        expect(result.isValid).toBe(false)
        expect(result.errorMessage).toBe('No filename provided')
      })

      test('should handle undefined filename', () => {
        const result = service.validateFileExtension(undefined, ['kml'])

        expect(result.isValid).toBe(false)
        expect(result.errorMessage).toBe('No filename provided')
      })

      test('should handle empty string filename', () => {
        const result = service.validateFileExtension('', ['kml'])

        expect(result.isValid).toBe(false)
        expect(result.errorMessage).toBe('No filename provided')
      })

      test('should handle non-string filename', () => {
        const result = service.validateFileExtension(123, ['kml'])

        expect(result.isValid).toBe(false)
        expect(result.errorMessage).toBe('No filename provided')
      })

      test('should handle null allowedExtensions', () => {
        const result = service.validateFileExtension('file.kml', null)

        expect(result.isValid).toBe(false)
        expect(result.errorMessage).toBe('No allowed extensions specified')
      })

      test('should handle empty allowedExtensions array', () => {
        const result = service.validateFileExtension('file.kml', [])

        expect(result.isValid).toBe(false)
        expect(result.errorMessage).toBe('No allowed extensions specified')
      })

      test('should handle non-array allowedExtensions', () => {
        const result = service.validateFileExtension('file.kml', 'kml')

        expect(result.isValid).toBe(false)
        expect(result.errorMessage).toBe('No allowed extensions specified')
      })
    })

    describe('error messages', () => {
      test('should generate correct error message for KML', () => {
        const result = service.validateFileExtension('file.pdf', ['kml'])

        expect(result.errorMessage).toBe('The selected file must be a KML file')
      })

      test('should generate correct error message for Shapefile', () => {
        const result = service.validateFileExtension('file.pdf', ['zip'])

        expect(result.errorMessage).toBe(
          'The selected file must be a Shapefile'
        )
      })

      test('should generate generic error message for unknown single extension', () => {
        const result = service.validateFileExtension('file.pdf', ['csv'])

        expect(result.errorMessage).toBe('The selected file must be a CSV file')
      })

      test('should generate multi-extension error message', () => {
        const result = service.validateFileExtension('file.pdf', ['kml', 'zip'])

        expect(result.errorMessage).toBe(
          'The selected file must be a KML or ZIP file'
        )
      })

      test('should generate multi-extension error message for more than two extensions', () => {
        const result = service.validateFileExtension('file.pdf', [
          'kml',
          'zip',
          'csv'
        ])

        expect(result.errorMessage).toBe(
          'The selected file must be a KML or ZIP or CSV file'
        )
      })
    })

    describe('logging', () => {
      test('should log validation attempts', () => {
        service.validateFileExtension('file.kml', ['kml'])

        expect(mockLogger.debug).toHaveBeenCalledWith(
          {
            filename: 'file.kml',
            extension: 'kml',
            allowedExtensions: ['kml'],
            isValid: true
          },
          'File extension validation'
        )
      })

      test('should log failed validation attempts', () => {
        service.validateFileExtension('file.pdf', ['kml'])

        expect(mockLogger.debug).toHaveBeenCalledWith(
          {
            filename: 'file.pdf',
            extension: 'pdf',
            allowedExtensions: ['kml'],
            isValid: false
          },
          'File extension validation'
        )
      })
    })
  })

  describe('_extractExtension', () => {
    test('should extract simple extension', () => {
      const result = service._extractExtension('file.kml')
      expect(result).toBe('kml')
    })

    test('should extract extension from complex filename', () => {
      const result = service._extractExtension('my.complex.file.name.kml')
      expect(result).toBe('kml')
    })

    test('should return empty string for no extension', () => {
      const result = service._extractExtension('filename')
      expect(result).toBe('')
    })

    test('should return empty string for filename ending with dot', () => {
      const result = service._extractExtension('filename.')
      expect(result).toBe('')
    })
  })

  describe('_buildErrorMessage', () => {
    test('should build KML-specific message', () => {
      const result = service._buildErrorMessage(['kml'])
      expect(result).toBe('The selected file must be a KML file')
    })

    test('should build Shapefile-specific message', () => {
      const result = service._buildErrorMessage(['zip'])
      expect(result).toBe('The selected file must be a Shapefile')
    })

    test('should build generic single extension message', () => {
      const result = service._buildErrorMessage(['csv'])
      expect(result).toBe('The selected file must be a CSV file')
    })

    test('should build multiple extension message', () => {
      const result = service._buildErrorMessage(['kml', 'zip'])
      expect(result).toBe('The selected file must be a KML or ZIP file')
    })
  })
})
