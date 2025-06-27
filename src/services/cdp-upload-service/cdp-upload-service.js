import Wreck from '@hapi/wreck'
import rfc2047 from 'rfc2047'
import { config } from '~/src/config/config.js'
import { createLogger } from '~/src/server/common/helpers/logging/logger.js'

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

// CDP Service Status Constants
const UPLOAD_STATUS = {
  INITIATED: 'initiated',
  PENDING: 'pending',
  READY: 'ready'
}

const FILE_STATUS = {
  PENDING: 'pending',
  COMPLETE: 'complete',
  REJECTED: 'rejected'
}

// Application Status Constants
const APP_STATUS = {
  PENDING: 'pending',
  SCANNING: 'scanning',
  READY: 'ready',
  REJECTED: 'rejected',
  ERROR: 'error'
}

// Error Classification
const ERROR_CODES = {
  NO_FILE_SELECTED: 'NO_FILE_SELECTED',
  VIRUS_DETECTED: 'VIRUS_DETECTED',
  FILE_EMPTY: 'FILE_EMPTY',
  FILE_TOO_LARGE: 'FILE_TOO_LARGE',
  INVALID_FILE_TYPE: 'INVALID_FILE_TYPE',
  PASSWORD_PROTECTED: 'PASSWORD_PROTECTED',
  UPLOAD_ERROR: 'UPLOAD_ERROR'
}

// HTTP Status Codes
const HTTP_STATUS = {
  NOT_FOUND: 404,
  SERVER_ERROR: 500
}

// API Configuration
const ENDPOINTS = {
  INITIATE: '/initiate',
  STATUS: '/status'
}

// User-Facing Messages
const ERROR_MESSAGES = {
  UPLOAD_NOT_FOUND: 'Upload session not found',
  SERVICE_UNAVAILABLE: 'Service temporarily unavailable',
  STATUS_CHECK_FAILED: 'Unable to check status',
  NO_FILE_SELECTED: 'Select a file to upload'
}

/**
 * @typedef {object} UploadConfig
 * @property {string} uploadId - UUID for this upload session
 * @property {string} uploadUrl - Direct upload endpoint URL
 * @property {statusUrl} statusUrl - The url to use to check the upload status
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
 * @property {string} [uploadedAt] - ISO timestamp of upload
 * @property {string} [completedAt] - ISO timestamp of completion (if applicable)
 * @property {string} [errorCode] - Error code for system logging
 * @property {boolean} [retryable] - Whether the operation can be retried
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

    this.logger.debug('CdpUploadService initialized', {
      cdpServiceBaseUrl: this.config.cdpUploadServiceBaseUrl,
      appBaseUrl: this.baseUrl,
      timeout: this.config.timeout,
      maxFileSize: this.config.maxFileSize,
      allowedMimeTypes: this.allowedMimeTypes
    })
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
      mimeTypes,
      s3Path,
      s3Bucket
    }

    try {
      this.logger.debug('Initiating upload session', requestPayload)
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

      this.logger.info('Upload session initiated successfully', {
        uploadId: data.uploadId,
        redirectUrl
      })

      // Transform CDP service response to our standardized UploadConfig format
      return {
        uploadId: data.uploadId,
        uploadUrl: data.uploadUrl,
        statusUrl: data.statusUrl,
        maxFileSize: this.config.maxFileSize,
        allowedTypes: mimeTypes ?? []
      }
    } catch (error) {
      this.logger.error('Failed to initiate upload session', {
        error: error.message,
        redirectUrl,
        mimeTypes,
        s3Path
      })
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
      this.logger.debug('Checking upload status', { uploadId, statusUrl })

      // Example response:
      // {
      //   "uploadStatus": "ready",
      //   "metadata": {
      //     "example-id": "id"
      //   },
      //   "form": {
      //     "a-form-field": "some value",
      //     "a-file-upload-field": {
      //       "fileId": "9fcaabe5-77ec-44db-8356-3a6e8dc51b13",
      //       "filename": "dragon-b.jpeg",
      //       "contentType": "image/jpeg",
      //       "fileStatus": "complete",
      //       "contentLength": 11264,
      //       "checksumSha256": "bng5jOVC6TxEgwTUlX4DikFtDEYEc8vQTsOP0ZAv21c=",
      //       "detectedContentType": "image/jpeg",
      //       "s3Key": "3b0b2a02-a669-44ba-9b78-bd5cb8460253/9fcaabe5-77ec-44db-8356-3a6e8dc51b13",
      //       "s3Bucket": "cdp-example-node-frontend"
      //     },
      //     "another-form-field": "foobazbar"
      //   },
      //   "numberOfRejectedFiles": 0
      // }

      const { res, payload } = await Wreck.get(statusUrl, {
        json: true,
        timeout: this.config.timeout
      })

      // Handle specific status error responses
      if (res.statusCode === HTTP_STATUS.NOT_FOUND) {
        this.logger.warn('Upload session not found', { uploadId })
        return this._createErrorResponse(
          ERROR_MESSAGES.UPLOAD_NOT_FOUND,
          ERROR_CODES.UPLOAD_ERROR,
          false
        )
      }

      if (res.statusCode >= HTTP_STATUS.SERVER_ERROR) {
        this.logger.error('Service error when checking status', {
          uploadId,
          status: res.statusCode
        })
        return this._createErrorResponse(
          ERROR_MESSAGES.SERVICE_UNAVAILABLE,
          ERROR_CODES.UPLOAD_ERROR,
          true
        )
      }

      this._validateHttpResponse(res, ENDPOINTS.STATUS, uploadId)

      // Process response from CDP Uploader service status endpoint
      // Response structure documented at: https://github.com/DEFRA/cdp-uploader/blob/main/README.md#get-statusuploadid
      const data = payload
      const transformedStatus = this._transformCdpResponse(data)

      this.logger.debug('Upload status retrieved', {
        uploadId,
        status: transformedStatus.status
      })

      return transformedStatus
    } catch (error) {
      if (error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT') {
        this.logger.error('Request timeout when checking status', {
          uploadId,
          error: error.message
        })
        return this._createErrorResponse(
          ERROR_MESSAGES.STATUS_CHECK_FAILED,
          ERROR_CODES.UPLOAD_ERROR,
          true
        )
      }

      this.logger.error('Failed to check upload status', {
        uploadId,
        error: error.message
      })
      throw error
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
    if (res.statusCode < 200 || res.statusCode >= 300) {
      const errorMessage = `API call failed with status: ${res.statusCode}`
      const logContext = {
        status: res.statusCode,
        statusText: res.statusMessage,
        endpoint
      }

      if (uploadId) {
        logContext.uploadId = uploadId
      }

      this.logger.error(errorMessage, logContext)
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

    // Validate form data exists
    const validationError = this._validateFormData(form)
    if (validationError) {
      return validationError
    }

    // Extract file data from form
    const fileData = this._extractFileData(form)
    if (!fileData) {
      return this._createErrorResponse(
        ERROR_MESSAGES.NO_FILE_SELECTED,
        ERROR_CODES.NO_FILE_SELECTED,
        true
      )
    }

    // Build and return standardized response
    return this._buildUploadStatusResponse(uploadStatus, fileData)
  }

  /**
   * Validates that form data exists and contains files
   * @param {object} form - Form data from CDP response
   * @returns {object|null} Error response if validation fails, null if valid
   * @private
   */
  _validateFormData(form) {
    if (!form || Object.keys(form).length === 0) {
      return this._createErrorResponse(
        ERROR_MESSAGES.NO_FILE_SELECTED,
        ERROR_CODES.NO_FILE_SELECTED,
        true
      )
    }
    return null
  }

  /**
   * Extracts file data from form object
   * @param {object} form - Form data from CDP response
   * @returns {object|null} File data object or null if not found
   * @private
   */
  _extractFileData(form) {
    return Object.values(form)[0] || null
  }

  /**
   * Builds standardized upload status response from file data
   * @param {string} uploadStatus - CDP upload status
   * @param {object} fileData - File data from CDP response
   * @returns {object} Standardized upload status response
   * @private
   */
  _buildUploadStatusResponse(uploadStatus, fileData) {
    const status = this._determineOverallStatus(
      uploadStatus,
      fileData.fileStatus,
      fileData.hasError
    )

    const result = this._createBaseStatusResponse(fileData, status)
    this._addTimestamps(result, status)
    this._addErrorDetails(result, fileData)

    return result
  }

  /**
   * Creates base status response with core file information
   * @param {object} fileData - File data from CDP response
   * @param {string} status - Determined upload status
   * @returns {object} Base response object
   * @private
   */
  _createBaseStatusResponse(fileData, status) {
    const result = {
      status,
      filename: this._extractFilename(fileData),
      fileSize: fileData.contentLength,
      uploadedAt: this._getCurrentTimestamp(),
      retryable: this._isRetryable(status)
    }

    // Include S3 information when upload is complete (AC8 requirement)
    if (
      status === APP_STATUS.READY &&
      fileData.s3Key &&
      fileData.s3Bucket &&
      fileData.fileId
    ) {
      result.s3Location = {
        s3Bucket: fileData.s3Bucket,
        s3Key: fileData.s3Key,
        fileId: fileData.fileId,
        s3Url: `s3://${fileData.s3Bucket}/${fileData.s3Key}/${fileData.fileId}`,
        detectedContentType: fileData.detectedContentType,
        checksumSha256: fileData.checksumSha256,
        contentLength: fileData.contentLength
      }
    }

    return result
  }

  /**
   * Adds completion timestamp for finished uploads
   * @param {object} result - Response object to modify
   * @param {string} status - Upload status
   * @private
   */
  _addTimestamps(result, status) {
    if (status === APP_STATUS.READY || status === APP_STATUS.REJECTED) {
      result.completedAt = this._getCurrentTimestamp()
    }
  }

  /**
   * Adds error details if file was rejected
   * @param {object} result - Response object to modify
   * @param {object} fileData - File data from CDP response
   * @private
   */
  _addErrorDetails(result, fileData) {
    if (fileData.hasError && fileData.errorMessage) {
      result.message = fileData.errorMessage // GDS approved message
      result.errorCode = this._getErrorCode(fileData.errorMessage)
    }
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
   * Determines if operation can be retried based on status
   * @param {string} status - Current status
   * @returns {boolean}
   * @private
   */
  _isRetryable(status) {
    return status === APP_STATUS.ERROR
  }

  /**
   * Extracts error code from error message for logging
   * @param {string} errorMessage - GDS error message
   * @returns {string}
   * @private
   */
  _getErrorCode(errorMessage) {
    const errorMappings = [
      { keywords: ['virus'], code: ERROR_CODES.VIRUS_DETECTED },
      { keywords: ['empty'], code: ERROR_CODES.FILE_EMPTY },
      {
        keywords: ['smaller than', 'must be smaller than'],
        code: ERROR_CODES.FILE_TOO_LARGE
      },
      {
        keywords: ['must be a', 'KML file', 'Shapefile'],
        code: ERROR_CODES.INVALID_FILE_TYPE
      },
      {
        keywords: ['password protected'],
        code: ERROR_CODES.PASSWORD_PROTECTED
      },
      { keywords: ['could not be uploaded'], code: ERROR_CODES.UPLOAD_ERROR }
    ]

    for (const mapping of errorMappings) {
      if (mapping.keywords.some((keyword) => errorMessage.includes(keyword))) {
        return mapping.code
      }
    }

    return ERROR_CODES.UPLOAD_ERROR
  }

  /**
   * Extracts filename from file data, handling both regular and RFC-2047 encoded filenames
   *
   * As per CdpFileData typedef: either filename or encodedfilename will be provided
   * depending on whether the original filename contained non-ascii characters.
   * Uses the rfc2047 npm package for proper RFC-2047 decoding.
   * @param {CdpFileData} fileData - File data from CDP response
   * @returns {string} Decoded filename
   * @private
   */
  _extractFilename(fileData) {
    // If regular filename is available, use it
    if (fileData.filename) {
      return fileData.filename
    }

    // If encoded filename is available, decode it from RFC-2047 format using proper library
    if (fileData.encodedfilename) {
      try {
        const decoded = rfc2047.decode(fileData.encodedfilename)
        return decoded
      } catch (error) {
        this.logger.warn('Failed to decode RFC-2047 filename', {
          encodedfilename: fileData.encodedfilename,
          error: error.message
        })
        // Fallback: return as-is if we can't decode
        return fileData.encodedfilename
      }
    }

    // Fallback if neither is available
    return 'unknown-file'
  }

  /**
   * Gets current timestamp in ISO format
   * @returns {string}
   * @private
   */
  _getCurrentTimestamp() {
    return new Date().toISOString()
  }

  /**
   * Extracts S3 file location from CDP response for session storage
   *
   * Fulfills AC8 requirement: "store the S3 file and bucket location in session storage"
   * @param {CdpStatusResponse} cdpResponse - Raw CDP status response
   * @returns {object|null} Complete S3 location object with all file metadata, or null if not ready.
   * When successful, returns object with properties:
   * - s3Bucket {string} - S3 bucket name
   * - s3Key {string} - S3 object key path
   * - fileId {string} - Unique file identifier (UUID)
   * - s3Url {string} - Complete S3 URL for file retrieval: s3://{bucket}/{key}/{fileId}
   * - filename {string} - Original filename (decoded if necessary)
   * - fileSize {number} - File size in bytes (alias for contentLength)
   * - detectedContentType {string} - MIME type detected by CDP uploader
   * - checksumSha256 {string} - SHA256 checksum for file integrity verification
   * - contentLength {number} - File size in bytes
   * - uploadedAt {string} - ISO timestamp of when extraction occurred
   */
  extractS3Location(cdpResponse) {
    if (cdpResponse.uploadStatus !== UPLOAD_STATUS.READY) {
      return null
    }

    const fileData = this._extractFileData(cdpResponse.form)
    if (
      !fileData?.s3Key ||
      !fileData?.s3Bucket ||
      !fileData?.fileId ||
      fileData.fileStatus !== FILE_STATUS.COMPLETE
    ) {
      return null
    }

    return {
      s3Bucket: fileData.s3Bucket,
      s3Key: fileData.s3Key,
      fileId: fileData.fileId,
      s3Url: `s3://${fileData.s3Bucket}/${fileData.s3Key}/${fileData.fileId}`,
      filename: this._extractFilename(fileData),
      fileSize: fileData.contentLength,
      detectedContentType: fileData.detectedContentType,
      checksumSha256: fileData.checksumSha256,
      contentLength: fileData.contentLength,
      uploadedAt: this._getCurrentTimestamp()
    }
  }
}

// Export status constants for use by consumers
export const UPLOAD_STATUSES = {
  ...UPLOAD_STATUS,
  ...FILE_STATUS,
  ...APP_STATUS
}
