import { describe, it, expect } from 'vitest'
import {
  GEO_PARSER_ERROR_MESSAGES,
  CDP_ERROR_MESSAGES,
  FILE_TYPE_ERROR_MESSAGES,
  DEFAULT_ERROR_MESSAGE,
  DEFAULT_GEO_PARSER_ERROR_MESSAGE
} from './error-messages.js'

describe('error-messages', () => {
  describe('GEO_PARSER_ERROR_MESSAGES', () => {
    it('should have message for SHAPEFILE_MISSING_CORE_FILES', () => {
      expect(GEO_PARSER_ERROR_MESSAGES.SHAPEFILE_MISSING_CORE_FILES).toBe(
        'The selected file must include .shp .shx and .dbf files'
      )
    })

    it('should have message for SHAPEFILE_MISSING_PRJ_FILE', () => {
      expect(GEO_PARSER_ERROR_MESSAGES.SHAPEFILE_MISSING_PRJ_FILE).toBe(
        'The selected file must include a .prj file'
      )
    })

    it('should have message for SHAPEFILE_PRJ_FILE_TOO_LARGE', () => {
      expect(GEO_PARSER_ERROR_MESSAGES.SHAPEFILE_PRJ_FILE_TOO_LARGE).toBe(
        "The selected file's .prj file must be smaller than 50KB"
      )
    })

    it('should have message for SHAPEFILE_NOT_FOUND', () => {
      expect(GEO_PARSER_ERROR_MESSAGES.SHAPEFILE_NOT_FOUND).toBe(
        'The selected file does not contain a valid shapefile'
      )
    })

    it('should have message for ZIP_TOO_MANY_FILES', () => {
      expect(GEO_PARSER_ERROR_MESSAGES.ZIP_TOO_MANY_FILES).toBe(
        'The selected file contains too many files'
      )
    })

    it('should have message for ZIP_TOO_LARGE', () => {
      expect(GEO_PARSER_ERROR_MESSAGES.ZIP_TOO_LARGE).toBe(
        'The selected file is too large'
      )
    })

    it('should have message for ZIP_COMPRESSION_SUSPICIOUS', () => {
      expect(GEO_PARSER_ERROR_MESSAGES.ZIP_COMPRESSION_SUSPICIOUS).toBe(
        'The selected file could not be processed – try again'
      )
    })

    it('should have message for COORDINATES_INVALID_LONGITUDE', () => {
      expect(GEO_PARSER_ERROR_MESSAGES.COORDINATES_INVALID_LONGITUDE).toBe(
        'The selected file contains invalid coordinates'
      )
    })

    it('should have message for COORDINATES_INVALID_LATITUDE', () => {
      expect(GEO_PARSER_ERROR_MESSAGES.COORDINATES_INVALID_LATITUDE).toBe(
        'The selected file contains invalid coordinates'
      )
    })

    it('should have message for UNSUPPORTED_FILE_TYPE', () => {
      expect(GEO_PARSER_ERROR_MESSAGES.UNSUPPORTED_FILE_TYPE).toBe(
        'The selected file type is not supported'
      )
    })
  })

  describe('CDP_ERROR_MESSAGES', () => {
    it('should have message for VIRUS_DETECTED', () => {
      expect(CDP_ERROR_MESSAGES.VIRUS_DETECTED).toBe(
        'The selected file contains a virus'
      )
    })

    it('should have message for FILE_EMPTY', () => {
      expect(CDP_ERROR_MESSAGES.FILE_EMPTY).toBe('The selected file is empty')
    })

    it('should have message for FILE_TOO_LARGE', () => {
      expect(CDP_ERROR_MESSAGES.FILE_TOO_LARGE).toBe(
        'The selected file must be smaller than 50 MB'
      )
    })

    it('should have message for NO_FILE_SELECTED', () => {
      expect(CDP_ERROR_MESSAGES.NO_FILE_SELECTED).toBe(
        'Select a file to upload'
      )
    })

    it('should have message for INVALID_FILE_TYPE', () => {
      expect(CDP_ERROR_MESSAGES.INVALID_FILE_TYPE).toBe(
        'The selected file type is not supported'
      )
    })

    it('should have message for UPLOAD_ERROR', () => {
      expect(CDP_ERROR_MESSAGES.UPLOAD_ERROR).toBe(
        'The selected file could not be uploaded – try again'
      )
    })
  })

  describe('FILE_TYPE_ERROR_MESSAGES', () => {
    it('should have message for kml file type', () => {
      expect(FILE_TYPE_ERROR_MESSAGES.kml).toBe(
        'The selected file must be a KML file'
      )
    })

    it('should have message for shapefile file type', () => {
      expect(FILE_TYPE_ERROR_MESSAGES.shapefile).toBe(
        'The selected file must be a Shapefile'
      )
    })
  })

  describe('DEFAULT_ERROR_MESSAGE', () => {
    it('should be defined', () => {
      expect(DEFAULT_ERROR_MESSAGE).toBe(
        'The selected file could not be uploaded – try again'
      )
    })
  })

  describe('DEFAULT_GEO_PARSER_ERROR_MESSAGE', () => {
    it('should be defined', () => {
      expect(DEFAULT_GEO_PARSER_ERROR_MESSAGE).toBe(
        'The selected file could not be processed – try again'
      )
    })
  })
})
