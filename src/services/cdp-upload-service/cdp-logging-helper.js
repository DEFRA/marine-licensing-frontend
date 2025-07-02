/**
 * CDP Upload Service Logging Helper
 *
 * Handles verbose debug logging for CDP upload operations.
 * Extracted from main service class to improve readability and maintainability.
 */
export class CdpLoggingHelper {
  /**
   * @param {object} logger - Logger instance
   */
  constructor(logger) {
    this.logger = logger
  }

  /**
   * Logs complete CDP service response for debugging
   * @param {string} uploadId - Upload ID for context
   * @param {object} data - CDP response data
   */
  logCdpResponse(uploadId, data) {
    this.logger.debug(`CDP service response received for ${uploadId}`)
    this.logger.debug(`Full CDP Response: ${JSON.stringify(data, null, 2)}`)
  }

  /**
   * Logs the start of response transformation process
   * @param {string} uploadStatus - CDP upload status
   * @param {object} form - Form data from CDP response
   */
  logTransformationStart(uploadStatus, form) {
    this.logger.debug(`Starting response transformation`)
    this.logger.debug(`Upload Status: ${uploadStatus}`)
    this.logger.debug(
      `Form Object Count: ${form ? Object.keys(form).length : 0}`
    )

    if (form) {
      this.logger.debug(`Form Data: ${JSON.stringify(form, null, 2)}`)
    } else {
      this.logger.debug('Form Data: null')
    }
  }

  /**
   * Logs file data extraction results
   * @param {object} fileData - Extracted file data
   * @param {object} form - Original form data
   */
  logFileDataExtraction(fileData, form) {
    this.logger.debug(`File data extraction result`)
    this.logger.debug(`File Data Exists: ${!!fileData}`)

    if (fileData) {
      this.logger.debug(
        `Extracted File Data: ${JSON.stringify(fileData, null, 2)}`
      )
    } else {
      this.logger.debug('Extracted File Data: null')
    }

    if (form && Object.keys(form).length > 0) {
      this.logger.debug(
        `First Form Value: ${JSON.stringify(Object.values(form)[0], null, 2)}`
      )
    } else {
      this.logger.debug('First Form Value: no form values')
    }
  }

  /**
   * Logs final transformation result
   * @param {object} result - Final transformation result
   */
  logTransformationResult(result) {
    this.logger.debug('Final transformation result', {
      resultStatus: result.status,
      resultMessage: result.message,
      fullResult: JSON.stringify(result, null, 2)
    })
  }

  /**
   * Logs status building process details
   * @param {string} uploadStatus - CDP upload status
   * @param {object} fileData - File data object
   */
  logStatusBuilding(uploadStatus, fileData) {
    this.logger.debug('Building upload status response', {
      uploadStatus,
      fileDataType: typeof fileData,
      fileDataKeys: fileData ? Object.keys(fileData) : [],
      fileStatus: fileData?.fileStatus,
      hasError: fileData?.hasError,
      errorMessage: fileData?.errorMessage
    })
  }

  /**
   * Logs status determination result
   * @param {string} status - Determined status
   * @param {string} uploadStatus - CDP upload status
   * @param {object} fileData - File data object
   */
  logStatusDetermination(status, uploadStatus, fileData) {
    this.logger.debug('Status determination result', {
      determinedStatus: status,
      inputs: {
        uploadStatus,
        fileStatus: fileData.fileStatus,
        hasError: fileData.hasError
      }
    })
  }
}
