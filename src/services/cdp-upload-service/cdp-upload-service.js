import Wreck from '@hapi/wreck'
import { config } from '~/src/config/config.js'
import { createLogger } from '~/src/server/common/helpers/logging/logger.js'

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
  STATUS_CHECK_FAILED: 'Unable to check status'
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
    this.logger = createLogger()

    this.logger.debug('CdpUploadService initialized', {
      baseUrl: this.config.baseUrl,
      timeout: this.config.timeout,
      maxFileSize: this.config.maxFileSize,
      allowedMimeTypes: this.allowedMimeTypes
    })
  }

  /**
   * Initiates a new file upload session with CDP Uploader
   * @param {object} options - Configuration options for the upload session
   * @param {string} options.redirectUrl - URL to redirect user after upload completion
   * @param {string[]?} options.allowedMimeTypes - Array of allowed MIME types to override constructor defaults
   * @param {string?} options.s3Path - Optional S3 path prefix for organizing files in folders (defaults to empty string)
   * @param {object?} options.metadata - Optional metadata object to attach to the upload
   * @returns {Promise<UploadConfig>}
   */
  async initiate({ redirectUrl, allowedMimeTypes, s3Path = '', metadata }) {
    const mimeTypes = allowedMimeTypes ?? this.allowedMimeTypes
    const requestPayload = {
      redirectUrl,
      maxFileSize: this.config.maxFileSize,
      mimeTypes,
      s3Path
    }

    // Add metadata to payload if provided
    if (metadata) {
      requestPayload.metadata = metadata
    }

    try {
      this.logger.debug('Initiating upload session', {
        redirectUrl,
        maxFileSize: this.config.maxFileSize,
        mimeTypes,
        s3Path,
        metadata
      })

      const { res, payload } = await Wreck.post(
        `${this.config.baseUrl}${ENDPOINTS.INITIATE}`,
        {
          payload: requestPayload,
          json: true,
          timeout: this.config.timeout
        }
      )

      if (res.statusCode < 200 || res.statusCode >= 300) {
        const errorMessage = `API call failed with status: ${res.statusCode}`
        this.logger.error(errorMessage, {
          status: res.statusCode,
          statusText: res.statusMessage,
          endpoint: ENDPOINTS.INITIATE
        })
        throw new Error(errorMessage)
      }

      const data = payload

      this.logger.info('Upload session initiated successfully', {
        uploadId: data.uploadId,
        redirectUrl
      })

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
        s3Path,
        metadata
      })
      throw error
    }
  }

  /**
   * Polls the status of an upload operation
   * @param {string} uploadId - UUID of the upload session to check
   * @param {string} statusUrl - the URL provided in the initiate() response to retrieve the status of the file
   * @returns {Promise<UploadStatus>}
   */
  async getStatus(uploadId, statusUrl) {
    try {
      this.logger.debug('Checking upload status', { uploadId, statusUrl })

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
   * @param {object} cdpResponse - Raw response from CDP Uploader
   * @returns {UploadStatus}
   * @private
   */
  _transformCdpResponse(cdpResponse) {
    const { uploadStatus, form } = cdpResponse

    // Handle case where no files were uploaded yet
    if (!form || Object.keys(form).length === 0) {
      return {
        status: this._mapUploadStatus(uploadStatus),
        message: 'Upload pending'
      }
    }

    // Get the first file from the form (assuming single file upload)
    const fileData = Object.values(form)[0]

    if (!fileData) {
      return {
        status: this._mapUploadStatus(uploadStatus),
        message: 'Upload pending'
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
      return 'VIRUS_DETECTED'
    }
    if (errorMessage.includes('empty')) {
      return 'FILE_EMPTY'
    }
    if (errorMessage.includes('smaller than')) {
      return 'FILE_TOO_LARGE'
    }
    if (errorMessage.includes('must be a')) {
      return 'INVALID_FILE_TYPE'
    }
    if (errorMessage.includes('password protected')) {
      return 'PASSWORD_PROTECTED'
    }
    return 'UPLOAD_ERROR'
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
