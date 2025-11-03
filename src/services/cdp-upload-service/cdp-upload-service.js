import Wreck from '@hapi/wreck'
import { config } from '#src/config/config.js'
import { createLogger } from '#src/server/common/helpers/logging/logger.js'
import { CdpLoggingHelper } from './cdp-logging-helper.js'
import { S3LocationBuilder } from './s3-location-builder.js'
import { FilenameHandler } from './filename-handler.js'

const CDP_CONSTANTS = {
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

  APP_STATUS: {
    PENDING: 'pending',
    SCANNING: 'scanning',
    READY: 'ready',
    REJECTED: 'rejected',
    ERROR: 'error'
  },

  ERROR_CODES: {
    NO_FILE_SELECTED: 'NO_FILE_SELECTED',
    VIRUS_DETECTED: 'VIRUS_DETECTED',
    FILE_EMPTY: 'FILE_EMPTY',
    FILE_TOO_LARGE: 'FILE_TOO_LARGE',
    INVALID_FILE_TYPE: 'INVALID_FILE_TYPE',
    UPLOAD_ERROR: 'UPLOAD_ERROR'
  },

  HTTP_STATUS: {
    NOT_FOUND: 404,
    SERVER_ERROR: 500
  },

  ENDPOINTS: {
    INITIATE: '/initiate',
    STATUS: '/status'
  },

  ERROR_MESSAGES: {
    UPLOAD_NOT_FOUND: 'Upload session not found',
    SERVICE_UNAVAILABLE: 'Service temporarily unavailable',
    STATUS_CHECK_FAILED: 'Unable to check status',
    NO_FILE_SELECTED: 'Select a file to upload'
  },

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

export class CdpUploadService {
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

  _validateInitiateParams({ redirectUrl, s3Bucket }) {
    if (!redirectUrl) {
      throw new Error('redirectUrl is required')
    }

    if (!s3Bucket) {
      throw new Error('S3 Bucket is required')
    }
  }

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

  _createErrorResponse(message, errorCode, retryable) {
    return {
      status: APP_STATUS.ERROR,
      message,
      errorCode,
      retryable
    }
  }

  _createNoFileSelectedError() {
    return this._createErrorResponse(
      ERROR_MESSAGES.NO_FILE_SELECTED,
      ERROR_CODES.NO_FILE_SELECTED,
      true
    )
  }

  _createUploadNotFoundError() {
    return this._createErrorResponse(
      ERROR_MESSAGES.UPLOAD_NOT_FOUND,
      ERROR_CODES.UPLOAD_ERROR,
      false
    )
  }

  _createServiceUnavailableError() {
    return this._createErrorResponse(
      ERROR_MESSAGES.SERVICE_UNAVAILABLE,
      ERROR_CODES.UPLOAD_ERROR,
      true
    )
  }

  _createNetworkTimeoutError() {
    return this._createErrorResponse(
      ERROR_MESSAGES.STATUS_CHECK_FAILED,
      ERROR_CODES.UPLOAD_ERROR,
      true
    )
  }

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

  _extractAndValidateFileData(form) {
    // Validate form data exists and contains files
    if (!form || Object.keys(form).length === 0) {
      return null
    }

    // Extract first file data from form
    return Object.values(form)[0] || null
  }

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

  _extractErrorCode(errorMessage) {
    for (const mapping of CDP_CONSTANTS.ERROR_MAPPINGS) {
      if (mapping.keywords.some((keyword) => errorMessage.includes(keyword))) {
        return ERROR_CODES[mapping.code]
      }
    }

    return ERROR_CODES.UPLOAD_ERROR
  }

  _getTimestamp() {
    return new Date().toISOString()
  }

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

export const CDP_ERROR_CODES = CDP_CONSTANTS.ERROR_CODES

export { CDP_CONSTANTS }
