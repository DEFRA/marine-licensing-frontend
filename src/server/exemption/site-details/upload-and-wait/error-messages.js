export const GEO_PARSER_ERROR_MESSAGES = {
  SHAPEFILE_MISSING_CORE_FILES:
    'The selected file must include .shp .shx and .dbf files',
  SHAPEFILE_MISSING_PRJ_FILE: 'The selected file must include a .prj file',
  SHAPEFILE_PRJ_FILE_TOO_LARGE:
    "The selected file's .prj file must be smaller than 50KB",
  SHAPEFILE_NOT_FOUND: 'The selected file does not contain a valid shapefile',
  ZIP_TOO_MANY_FILES: 'The selected file contains too many files',
  ZIP_TOO_LARGE: 'The selected file is too large',
  ZIP_COMPRESSION_SUSPICIOUS:
    'The selected file could not be processed – try again',
  COORDINATES_INVALID_LONGITUDE:
    'The selected file contains invalid coordinates',
  COORDINATES_INVALID_LATITUDE:
    'The selected file contains invalid coordinates',
  UNSUPPORTED_FILE_TYPE: 'The selected file type is not supported'
}

/**
 * CDP error code to user-friendly message mapping
 * Maps error codes from CDP upload service to GDS-approved error messages
 */
export const CDP_ERROR_MESSAGES = {
  VIRUS_DETECTED: 'The selected file contains a virus',
  FILE_EMPTY: 'The selected file is empty',
  FILE_TOO_LARGE: 'The selected file must be smaller than 50 MB',
  NO_FILE_SELECTED: 'Select a file to upload',
  INVALID_FILE_TYPE: 'The selected file type is not supported',
  UPLOAD_ERROR: 'The selected file could not be uploaded – try again'
}

export const FILE_TYPE_ERROR_MESSAGES = {
  kml: 'The selected file must be a KML file',
  shapefile: 'The selected file must be a Shapefile'
}

export const DEFAULT_ERROR_MESSAGE =
  'The selected file could not be uploaded – try again'

export const DEFAULT_GEO_PARSER_ERROR_MESSAGE =
  'The selected file could not be processed – try again'
