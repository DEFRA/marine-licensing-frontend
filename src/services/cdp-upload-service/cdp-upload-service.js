import Wreck from '@hapi/wreck'
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

// Status constants
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

const ERROR_STATUS = {
  ERROR: 'error'
}

// Error codes
const ERROR_CODES = {
  NO_FILE_SELECTED: 'NO_FILE_SELECTED',
  VIRUS_DETECTED: 'VIRUS_DETECTED',
  FILE_EMPTY: 'FILE_EMPTY',
  FILE_TOO_LARGE: 'FILE_TOO_LARGE',
  INVALID_FILE_TYPE: 'INVALID_FILE_TYPE',
  PASSWORD_PROTECTED: 'PASSWORD_PROTECTED',
  UPLOAD_ERROR: 'UPLOAD_ERROR'
}

// HTTP status codes
const HTTP_STATUS = {
  NOT_FOUND: 404,
  SERVER_ERROR: 500
}

// API endpoints
const ENDPOINTS = {
  INITIATE: '/initiate',
  STATUS: '/status'
}

// Error messages
const ERROR_MESSAGES = {
  UPLOAD_NOT_FOUND: 'Upload session not found',
  SERVICE_UNAVAILABLE: 'Service temporarily unavailable',
  STATUS_CHECK_FAILED: 'Unable to check status',
  NO_FILE_SELECTED: 'No file selected'
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
 * @property {string} filename - Original filename of the uploaded file
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
 * @property {string} [filename] - Original uploaded filename
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
    const mimeTypes = allowedMimeTypes ?? this.allowedMimeTypes

    if (!redirectUrl) {
      throw new Error('redirectUrl is required')
    }

    if (!s3Bucket) {
      throw new Error('S3 Bucket is required')
    }

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

      if (res.statusCode < 200 || res.statusCode >= 300) {
        const errorMessage = `API call failed with status: ${res.statusCode}`
        this.logger.error(errorMessage, {
          status: res.statusCode,
          statusText: res.statusMessage,
          endpoint: ENDPOINTS.INITIATE
        })
        throw new Error(errorMessage)
      }

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

      if (res.statusCode === HTTP_STATUS.NOT_FOUND) {
        this.logger.warn('Upload session not found', { uploadId })
        return {
          status: ERROR_STATUS.ERROR,
          message: ERROR_MESSAGES.UPLOAD_NOT_FOUND,
          retryable: false
        }
      }

      if (res.statusCode >= HTTP_STATUS.SERVER_ERROR) {
        this.logger.error('Service error when checking status', {
          uploadId,
          status: res.statusCode
        })
        return {
          status: ERROR_STATUS.ERROR,
          message: ERROR_MESSAGES.SERVICE_UNAVAILABLE,
          retryable: true
        }
      }

      if (res.statusCode < 200 || res.statusCode >= 300) {
        const errorMessage = `API call failed with status: ${res.statusCode}`
        this.logger.error(errorMessage, {
          uploadId,
          status: res.statusCode,
          statusText: res.statusMessage
        })
        throw new Error(errorMessage)
      }

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
        return {
          status: ERROR_STATUS.ERROR,
          message: ERROR_MESSAGES.STATUS_CHECK_FAILED,
          retryable: true
        }
      }

      this.logger.error('Failed to check upload status', {
        uploadId,
        error: error.message
      })
      throw error
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

    // Handle case where no files were uploaded yet
    if (!form || Object.keys(form).length === 0) {
      return {
        status: ERROR_STATUS.ERROR,
        message: ERROR_MESSAGES.NO_FILE_SELECTED,
        errorCode: ERROR_CODES.NO_FILE_SELECTED,
        retryable: true
      }
    }

    // Get the first file from the form (assuming single file upload)
    const fileData = Object.values(form)[0]

    if (!fileData) {
      return {
        status: ERROR_STATUS.ERROR,
        message: ERROR_MESSAGES.NO_FILE_SELECTED,
        errorCode: ERROR_CODES.NO_FILE_SELECTED,
        retryable: true
      }
    }

    const status = this._determineOverallStatus(
      uploadStatus,
      fileData.fileStatus,
      fileData.hasError
    )

    const result = {
      status,
      filename: fileData.filename,
      fileSize: fileData.contentLength,
      uploadedAt: this._getCurrentTimestamp(),
      retryable: this._isRetryable(status)
    }

    // Add completion timestamp for completed uploads
    if (status === 'ready' || status === 'rejected') {
      result.completedAt = this._getCurrentTimestamp()
    }

    // Add error details if file was rejected
    if (fileData.hasError && fileData.errorMessage) {
      result.message = fileData.errorMessage // GDS approved message
      result.errorCode = this._getErrorCode(fileData.errorMessage)
    }

    return result
  }

  /**
   * Maps CDP uploadStatus to our status values
   * @param {string} uploadStatus - CDP upload status
   * @returns {string}
   * @private
   */
  _mapUploadStatus(uploadStatus) {
    switch (uploadStatus) {
      case UPLOAD_STATUS.INITIATED:
      case UPLOAD_STATUS.PENDING:
        return 'pending'
      case UPLOAD_STATUS.READY:
        return 'scanning'
      default:
        return 'pending'
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
      return 'rejected'
    }

    if (
      fileStatus === FILE_STATUS.COMPLETE &&
      uploadStatus === UPLOAD_STATUS.READY
    ) {
      return 'ready'
    }

    if (fileStatus === FILE_STATUS.PENDING) {
      return 'scanning'
    }

    return 'pending'
  }

  /**
   * Determines if operation can be retried based on status
   * @param {string} status - Current status
   * @returns {boolean}
   * @private
   */
  _isRetryable(status) {
    return status === ERROR_STATUS.ERROR
  }

  /**
   * Extracts error code from error message for logging
   * @param {string} errorMessage - GDS error message
   * @returns {string}
   * @private
   */
  _getErrorCode(errorMessage) {
    if (errorMessage.includes('virus')) {
      return ERROR_CODES.VIRUS_DETECTED
    }
    if (errorMessage.includes('empty')) {
      return ERROR_CODES.FILE_EMPTY
    }
    if (errorMessage.includes('smaller than')) {
      return ERROR_CODES.FILE_TOO_LARGE
    }
    if (errorMessage.includes('must be a')) {
      return ERROR_CODES.INVALID_FILE_TYPE
    }
    if (errorMessage.includes('password protected')) {
      return ERROR_CODES.PASSWORD_PROTECTED
    }
    return ERROR_CODES.UPLOAD_ERROR
  }

  /**
   * Gets current timestamp in ISO format
   * @returns {string}
   * @private
   */
  _getCurrentTimestamp() {
    return new Date().toISOString()
  }
}

// Export status constants for use by consumers
export const UPLOAD_STATUSES = {
  ...UPLOAD_STATUS,
  ...FILE_STATUS,
  ...ERROR_STATUS
}
