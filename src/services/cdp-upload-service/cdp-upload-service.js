import Wreck from '@hapi/wreck'
import { config } from '~/src/config/config.js'
import { createLogger } from '~/src/server/common/helpers/logging/logger.js'
import { CdpLoggingHelper } from './cdp-logging-helper.js'
import { S3LocationBuilder } from './s3-location-builder.js'
import { FilenameHandler } from './filename-handler.js'

/**
 * CDP Upload Service integration
 *
 * Integrates with the DEFRA CDP Uploader service for secure file uploads with virus scanning.
 * External service API documentation: https://github.com/DEFRA/cdp-uploader/blob/main/README.md
 *
 * Key endpoints:
 * - POST /initiate - Creates new upload session
 * - GET /status/{uploadId} - Checks upload/scan status
 */

// CDP Service Integration Constants
const CDP_CONSTANTS = {
  // CDP Service Status Constants
  UPLOAD_STATUS: {
    INITIATED: 'initiated',
    PENDING: 'pending',
    READY: 'ready'
  },

  FILE_STATUS: {
    PENDING: 'pending',
    COMPLETE: 'complete',
    REJECTED: 'rejected'
  },

  // Application Status Constants
  APP_STATUS: {
    PENDING: 'pending',
    SCANNING: 'scanning',
    READY: 'ready',
    REJECTED: 'rejected',
    ERROR: 'error'
  },

  // Error Classification
  ERROR_CODES: {
    NO_FILE_SELECTED: 'NO_FILE_SELECTED',
    VIRUS_DETECTED: 'VIRUS_DETECTED',
    FILE_EMPTY: 'FILE_EMPTY',
    FILE_TOO_LARGE: 'FILE_TOO_LARGE',
    INVALID_FILE_TYPE: 'INVALID_FILE_TYPE',
    UPLOAD_ERROR: 'UPLOAD_ERROR'
  },

  // HTTP Status Codes
  HTTP_STATUS: {
    NOT_FOUND: 404,
    SERVER_ERROR: 500
  },

  // API Configuration
  ENDPOINTS: {
    INITIATE: '/initiate',
    STATUS: '/status'
  },

  // User-Facing Messages
  ERROR_MESSAGES: {
    UPLOAD_NOT_FOUND: 'Upload session not found',
    SERVICE_UNAVAILABLE: 'Service temporarily unavailable',
    STATUS_CHECK_FAILED: 'Unable to check status',
    NO_FILE_SELECTED: 'Select a file to upload'
  },

  // Error Message to Code Mappings
  ERROR_MAPPINGS: [
    { keywords: ['virus'], code: 'VIRUS_DETECTED' },
    { keywords: ['empty'], code: 'FILE_EMPTY' },
    {
      keywords: ['smaller than', 'must be smaller than'],
      code: 'FILE_TOO_LARGE'
    },
    {
      keywords: ['must be a', 'KML file', 'Shapefile'],
      code: 'INVALID_FILE_TYPE'
    },
    { keywords: ['could not be uploaded'], code: 'UPLOAD_ERROR' }
  ]
}

const {
  UPLOAD_STATUS,
  FILE_STATUS,
  APP_STATUS,
  ERROR_CODES,
  HTTP_STATUS,
  ENDPOINTS,
  ERROR_MESSAGES
} = CDP_CONSTANTS

/**
 * @typedef {object} UploadConfig
 * @property {string} uploadId - UUID for this upload session
 * @property {string} uploadUrl - Direct upload endpoint URL
 * @property {string} statusUrl - The URL to use to check the upload status
 * @property {number} maxFileSize - Maximum allowed file size in bytes
 * @property {string[]} allowedTypes - Array of allowed MIME types
 */

/**
 * @typedef {object} CdpInitiateResponse
 * @property {string} uploadId - Unique identifier for the upload session (UUID format)
 * @property {string} uploadUrl - Relative URL path for the multipart upload (e.g., "/upload-and-scan/{uploadId}")
 * @property {string} statusUrl - Full URL to poll for upload status (e.g., "https://cdp-uploader/status/{uploadId}")
 */

/**
 * @typedef {object} CdpFileData
 * @property {string} fileId - UUID of the uploaded file
 * @property {string} filename - Optional: original filename of the uploaded file
 * @property {string} encodedfilename - Optional: either filename or encodedfilename will be provided. RFC-2047 encoded filename if the filename contained non-ascii characters.
 * @property {string} contentType - MIME type as declared in the multipart upload
 * @property {'pending'|'complete'|'rejected'} fileStatus - File processing status
 * @property {number} contentLength - File size in bytes
 * @property {string} checksumSha256 - SHA256 checksum of the file received by CDP uploader
 * @property {string} detectedContentType - MIME type as detected by CDP uploader
 * @property {string} [s3Key] - S3 path where file is stored (only when fileStatus is 'complete')
 * @property {string} [s3Bucket] - S3 bucket where file is stored (only when fileStatus is 'complete')
 * @property {boolean} [hasError] - True if file was rejected or could not be delivered
 * @property {string} [errorMessage] - GDS-compliant error message for rejected files
 */

/**
 * @typedef {object} CdpStatusResponse
 * @property {'initiated'|'pending'|'ready'} uploadStatus - Overall upload session status
 * @property {object} [metadata] - Custom metadata provided in the initiate request
 * @property {object} form - Object containing all form fields from the multipart upload
 * @property {number} numberOfRejectedFiles - Total count of files rejected by the uploader
 */

/**
 * @typedef {object} UploadStatus
 * @property {'pending'|'scanning'|'ready'|'rejected'|'error'} status - Upload status
 * @property {string} [message] - User-friendly status message (GDS approved)
 * @property {string} [filename] - Original uploaded filename (decoded from RFC-2047 if necessary)
 * @property {number} [fileSize] - File size in bytes
 * @property {string} [completedAt] - ISO timestamp of completion (if applicable)
 * @property {string} [errorCode] - Error code for system logging
 * @property {object} [s3Location] - S3 location information when status is 'ready'
 * @property {string} [s3Location.s3Bucket] - S3 bucket name
 * @property {string} [s3Location.s3Key] - S3 object key path
 * @property {string} [s3Location.fileId] - Unique file identifier (UUID)
 * @property {string} [s3Location.s3Url] - Complete S3 URL (s3://{bucket}/{key})
 * @property {string} [s3Location.detectedContentType] - MIME type detected by CDP uploader
 * @property {string} [s3Location.checksumSha256] - SHA256 checksum for file integrity
 */

/**
 * CDP Upload Service for secure file uploads with virus scanning
 */
export class CdpUploadService {
  /**
   * @param {string[]?} allowedMimeTypes - Optional array of allowed MIME types
   */
  constructor(allowedMimeTypes) {
    this.allowedMimeTypes = allowedMimeTypes
    this.config = config.get('cdpUploader')
    this.baseUrl = config.get('appBaseUrl')
    this.logger = createLogger()

    // Initialize utility helpers
    this.loggingHelper = new CdpLoggingHelper(this.logger)
    this.filenameHandler = new FilenameHandler(this.logger)

    this.logger.debug(
      {
        cdpServiceBaseUrl: this.config.cdpUploadServiceBaseUrl,
        appBaseUrl: this.baseUrl,
        timeout: this.config.timeout,
        maxFileSize: this.config.maxFileSize,
        allowedMimeTypes: this.allowedMimeTypes
      },
      'CdpUploadService initialized'
    )
  }

  /**
   * Initiates a new file upload session with CDP Uploader
   *
   * Makes a POST request to the CDP Uploader service /initiate endpoint.
   * The external service generates an uploadId and returns URLs for upload and status checking.
   *
   * External service response structure (CdpInitiateResponse):
   * - uploadId: UUID generated by CDP service for this upload session
   * - uploadUrl: Relative path for multipart upload (e.g., "/upload-and-scan/{uploadId}")
   * - statusUrl: Full URL for polling upload status (e.g., "https://cdp-uploader/status/{uploadId}")
   * @param {object} options - Configuration options for the upload session
   * @param {string} options.redirectUrl - URL to redirect user after upload completion
   * @param {string[]?} options.allowedMimeTypes - Array of allowed MIME types to override constructor defaults
   * @param {string?} options.s3Path - Optional S3 path prefix for organizing files in folders (defaults to empty string)
   * @param {string} options.s3Bucket - Required
   * @returns {Promise<UploadConfig>}
   */
  async initiate({ redirectUrl, s3Bucket, allowedMimeTypes, s3Path = '' }) {
    this._validateInitiateParams({ redirectUrl, s3Bucket })

    const mimeTypes = allowedMimeTypes ?? this.allowedMimeTypes
    const requestPayload = {
      redirect: redirectUrl,
      maxFileSize: this.config.maxFileSize,
      s3Path,
      s3Bucket
    }

    if (mimeTypes !== null) {
      requestPayload.mimeTypes = mimeTypes
    }

    try {
      this.logger.debug(
        `CdpUploadService: initiate() called with params: ${JSON.stringify(requestPayload, null, 2)})`
      )
      const endPointUrl = `${this.config.cdpUploadServiceBaseUrl}${ENDPOINTS.INITIATE}`
      const { res, payload } = await Wreck.post(endPointUrl, {
        payload: JSON.stringify(requestPayload),
        json: true,
        timeout: this.config.timeout
      })

      this._validateHttpResponse(res, ENDPOINTS.INITIATE)

      // Process response from CDP Uploader service
      // Response structure documented at: https://github.com/DEFRA/cdp-uploader/blob/main/README.md#post-initiate
      const data = payload

      this.logger.info(
        {
          uploadId: data.uploadId,
          redirectUrl
        },
        'Upload session initiated successfully'
      )

      // Transform CDP service response to our standardized UploadConfig format
      return {
        uploadId: data.uploadId,
        uploadUrl: data.uploadUrl,
        statusUrl: data.statusUrl,
        maxFileSize: this.config.maxFileSize,
        allowedTypes: mimeTypes ?? []
      }
    } catch (error) {
      this.logger.error(
        {
          error: error.message,
          redirectUrl,
          mimeTypes
        },
        'Failed to initiate upload session'
      )
      throw error
    }
  }

  /**
   * Polls the status of an upload operation
   *
   * Makes a GET request to the CDP Uploader service status endpoint.
   * The external service returns comprehensive upload status including file details,
   * virus scan results, and S3 location information.
   *
   * External service response structure (CdpStatusResponse):
   * - uploadStatus: Overall session status ('initiated', 'pending', 'ready')
   * - metadata: Custom data provided during initiation
   * - form: Object containing all uploaded form fields and file data
   * - numberOfRejectedFiles: Count of rejected files
   *
   * File data in form fields includes virus scan status, S3 location,
   * checksums, and GDS-compliant error messages for rejected files.
   * @param {string} uploadId - UUID of the upload session to check
   * @param {string} statusUrl - the URL provided in the initiate() response to retrieve the status of the file
   * @returns {Promise<UploadStatus>}
   */
  async getStatus(uploadId, statusUrl) {
    try {
      this.logger.debug({ uploadId, statusUrl }, 'Checking upload status')

      const { res, payload } = await this._makeStatusRequest(statusUrl)

      // Handle specific status error responses
      const errorResponse = this._handleStatusErrors(res, uploadId)
      if (errorResponse) {
        return errorResponse
      }

      this._validateHttpResponse(res, ENDPOINTS.STATUS, uploadId)

      // Process response from CDP Uploader service status endpoint
      // Response structure documented at: https://github.com/DEFRA/cdp-uploader/blob/main/README.md#get-statusuploadid
      const data = payload

      this.loggingHelper.logCdpResponse(uploadId, data)

      const transformedStatus = this._transformCdpResponse(data)

      this.logger.debug(
        {
          uploadId,
          status: transformedStatus.status
        },
        'Upload status retrieved'
      )

      return transformedStatus
    } catch (error) {
      return this._handleNetworkErrors(error, uploadId)
    }
  }

  /**
   * Validates input parameters for initiate method
   * @param {object} params - Parameters to validate
   * @param {string} params.redirectUrl - URL to redirect user after upload completion
   * @param {string} params.s3Bucket - S3 bucket name
   * @throws {Error} When required parameters are missing
   * @private
   */
  _validateInitiateParams({ redirectUrl, s3Bucket }) {
    if (!redirectUrl) {
      throw new Error('redirectUrl is required')
    }

    if (!s3Bucket) {
      throw new Error('S3 Bucket is required')
    }
  }

  /**
   * Validates HTTP response status and throws error for non-success responses
   * @param {object} res - HTTP response object
   * @param {string} endpoint - API endpoint for logging context
   * @param {string?} uploadId - Optional upload ID for logging context
   * @throws {Error} When HTTP response indicates failure
   * @private
   */
  _validateHttpResponse(res, endpoint, uploadId) {
    const HTTP_200 = 200
    const HTTP_300 = 300
    if (res.statusCode < HTTP_200 || res.statusCode >= HTTP_300) {
      const errorMessage = `API call failed with status: ${res.statusCode}`
      const logContext = {
        status: res.statusCode,
        statusText: res.statusMessage,
        endpoint
      }

      if (uploadId) {
        logContext.uploadId = uploadId
      }

      this.logger.error(logContext, errorMessage)
      throw new Error(errorMessage)
    }
  }

  /**
   * Creates standardized error response object
   * @param {string} message - User-friendly error message
   * @param {string} errorCode - Error code for logging
   * @param {boolean} retryable - Whether the operation can be retried
   * @returns {object} Standardized error response
   * @private
   */
  _createErrorResponse(message, errorCode, retryable) {
    return {
      status: APP_STATUS.ERROR,
      message,
      errorCode,
      retryable
    }
  }

  /**
   * Creates error response for when no file is selected
   * @returns {object} Standardized error response
   * @private
   */
  _createNoFileSelectedError() {
    return this._createErrorResponse(
      ERROR_MESSAGES.NO_FILE_SELECTED,
      ERROR_CODES.NO_FILE_SELECTED,
      true
    )
  }

  /**
   * Creates error response for upload session not found (404)
   * @returns {object} Standardized error response
   * @private
   */
  _createUploadNotFoundError() {
    return this._createErrorResponse(
      ERROR_MESSAGES.UPLOAD_NOT_FOUND,
      ERROR_CODES.UPLOAD_ERROR,
      false
    )
  }

  /**
   * Creates error response for service unavailable (500+)
   * @returns {object} Standardized error response
   * @private
   */
  _createServiceUnavailableError() {
    return this._createErrorResponse(
      ERROR_MESSAGES.SERVICE_UNAVAILABLE,
      ERROR_CODES.UPLOAD_ERROR,
      true
    )
  }

  /**
   * Creates error response for network/timeout errors
   * @returns {object} Standardized error response
   * @private
   */
  _createNetworkTimeoutError() {
    return this._createErrorResponse(
      ERROR_MESSAGES.STATUS_CHECK_FAILED,
      ERROR_CODES.UPLOAD_ERROR,
      true
    )
  }

  /**
   * Transforms CDP Uploader response to standardized format
   *
   * Converts the complex CDP service response structure into our simplified UploadStatus format.
   * The CDP response includes detailed form data, file metadata, virus scan results, and S3 locations.
   * We extract the relevant file information and standardize error messages for frontend consumption.
   * @param {CdpStatusResponse} cdpResponse - Raw response from CDP Uploader status endpoint
   * @returns {UploadStatus}
   * @private
   */
  _transformCdpResponse(cdpResponse) {
    const { uploadStatus, form } = cdpResponse

    this.loggingHelper.logTransformationStart(uploadStatus, form)

    // Extract and validate file data from form
    const fileData = this._extractAndValidateFileData(form)
    if (!fileData) {
      this.logger.debug('No file data found, returning NO_FILE_SELECTED')
      return this._createNoFileSelectedError()
    }

    this.loggingHelper.logFileDataExtraction(fileData, form)

    // Build and return standardized response
    const result = this._buildCompleteStatusResponse(uploadStatus, fileData)
    this.loggingHelper.logTransformationResult(result)
    return result
  }

  /**
   * Extracts file data from form and validates it exists
   * @param {object} form - Form data from CDP response
   * @returns {object|null} File data object or null if not found/invalid
   * @private
   */
  _extractAndValidateFileData(form) {
    // Validate form data exists and contains files
    if (!form || Object.keys(form).length === 0) {
      return null
    }

    // Extract first file data from form
    return Object.values(form)[0] || null
  }

  /**
   * Builds complete upload status response from file data with all details
   * @param {string} uploadStatus - CDP upload status
   * @param {object} fileData - File data from CDP response
   * @returns {object} Complete standardized upload status response
   * @private
   */
  _buildCompleteStatusResponse(uploadStatus, fileData) {
    const status = this._determineOverallStatus(
      uploadStatus,
      fileData.fileStatus,
      fileData.hasError
    )

    this.loggingHelper.logStatusDetermination(status, uploadStatus, fileData)

    // Create base response with core information
    const result = {
      status,
      filename: this.filenameHandler.extractFilename(fileData),
      fileSize: fileData.contentLength
    }

    // Add completion timestamp for finished uploads
    if (status === APP_STATUS.READY || status === APP_STATUS.REJECTED) {
      result.completedAt = this._getTimestamp()
    }

    // Add error details if file was rejected
    if (fileData.hasError && fileData.errorMessage) {
      result.message = fileData.errorMessage // GDS approved message
      result.errorCode = this._extractErrorCode(fileData.errorMessage)
    }

    // Include S3 information when upload is complete (AC8 requirement)
    if (
      status === APP_STATUS.READY &&
      S3LocationBuilder.isFileReadyForS3(fileData, FILE_STATUS.COMPLETE)
    ) {
      result.s3Location = S3LocationBuilder.buildS3LocationObject(fileData)
    }

    return result
  }

  /**
   * Determines overall status based on upload and file status
   * @param {string} uploadStatus - CDP upload status
   * @param {string} fileStatus - CDP file status
   * @param {boolean} hasError - Whether file has error
   * @returns {string}
   * @private
   */
  _determineOverallStatus(uploadStatus, fileStatus, hasError) {
    if (hasError || fileStatus === FILE_STATUS.REJECTED) {
      return APP_STATUS.REJECTED
    }

    if (
      fileStatus === FILE_STATUS.COMPLETE &&
      uploadStatus === UPLOAD_STATUS.READY
    ) {
      return APP_STATUS.READY
    }

    if (fileStatus === FILE_STATUS.PENDING) {
      return APP_STATUS.SCANNING
    }

    return APP_STATUS.PENDING
  }

  /**
   * Extracts error code from error message for logging
   * @param {string} errorMessage - GDS error message
   * @returns {string}
   * @private
   */
  _extractErrorCode(errorMessage) {
    for (const mapping of CDP_CONSTANTS.ERROR_MAPPINGS) {
      if (mapping.keywords.some((keyword) => errorMessage.includes(keyword))) {
        return ERROR_CODES[mapping.code]
      }
    }

    return ERROR_CODES.UPLOAD_ERROR
  }

  /**
   * Gets current timestamp in ISO format
   * @returns {string}
   * @private
   */
  _getTimestamp() {
    return new Date().toISOString()
  }

  /**
   * Extracts S3 file location from CDP response for session storage
   * @param {CdpStatusResponse} cdpResponse - Raw CDP status response
   * @returns {S3Location|null} Complete S3 location object with file metadata, or null if not ready.
   * When successful, returns object with properties:
   * - s3Bucket {string} - S3 bucket name
   * - s3Key {string} - S3 object key path
   * - fileId {string} - Unique file identifier (UUID)
   * - s3Url {string} - Complete S3 URL in format s3://bucket/key
   * - detectedContentType {string} - MIME type detected by CDP uploader
   * - checksumSha256 {string} - SHA256 checksum for file integrity verification
   */
  extractS3Location(cdpResponse) {
    if (cdpResponse.uploadStatus !== UPLOAD_STATUS.READY) {
      return null
    }

    const fileData = this._extractAndValidateFileData(cdpResponse.form)
    if (!S3LocationBuilder.isFileReadyForS3(fileData, FILE_STATUS.COMPLETE)) {
      return null
    }

    return S3LocationBuilder.buildS3LocationObject(fileData)
  }

  _handleStatusErrors(res, uploadId) {
    if (res.statusCode === HTTP_STATUS.NOT_FOUND) {
      this.logger.warn({ uploadId }, 'Upload session not found')
      return this._createUploadNotFoundError()
    }

    if (res.statusCode >= HTTP_STATUS.SERVER_ERROR) {
      this.logger.error(
        {
          uploadId,
          status: res.statusCode
        },
        'Service error when checking status'
      )
      return this._createServiceUnavailableError()
    }

    return null
  }

  _handleNetworkErrors(error, uploadId) {
    if (error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT') {
      this.logger.error(
        {
          uploadId,
          error: error.message
        },
        'Request timeout when checking status'
      )
      return this._createNetworkTimeoutError()
    }

    this.logger.error(
      {
        uploadId,
        error: error.message
      },
      'Failed to check upload status'
    )
    throw error
  }

  async _makeStatusRequest(statusUrl) {
    return Wreck.get(statusUrl, {
      json: true,
      timeout: this.config.timeout
    })
  }
}

// Export status constants for use by consumers
export const UPLOAD_STATUSES = {
  ...CDP_CONSTANTS.UPLOAD_STATUS,
  ...CDP_CONSTANTS.FILE_STATUS,
  ...CDP_CONSTANTS.APP_STATUS
}

// Export the organized constants for advanced usage
export { CDP_CONSTANTS }
