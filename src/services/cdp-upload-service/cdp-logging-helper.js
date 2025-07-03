/**
 * CDP Upload Service Logging Helper
 *
 * Handles verbose debug logging for CDP upload operations.
 * Extracted from main service class to improve readability and maintainability.
 * All methods use debug level logging to avoid cluttering production logs.
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
   * @param {string} uploadId - Upload session UUID
   * @param {import('../cdp-upload-service.js').CdpStatusResponse} data - CDP response data
   */
  logCdpResponse(uploadId, data) {
    this.logger.debug(`CDP service response received for ${uploadId}`)
    this.logger.debug(`Full CDP Response: ${JSON.stringify(data, null, 2)}`)
  }

  /**
   * Logs the start of response transformation process
   * @param {'initiated'|'pending'|'ready'} uploadStatus - CDP upload status
   * @param {object} form - Form data from CDP response containing file information
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
   * Logs file data extraction results for debugging
   * @param {import('../cdp-upload-service.js').CdpFileData} fileData - Extracted file data
   * @param {object} form - Original form data containing file information
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
   * Logs final transformation result before returning to caller
   * @param {import('../cdp-upload-service.js').UploadStatus} result - Final transformation result
   */
  logTransformationResult(result) {
    this.logger.debug(`status() returning: ${JSON.stringify(result, null, 2)}`)
  }

  /**
   * Logs status determination result with input parameters for debugging
   * @param {'pending'|'scanning'|'ready'|'rejected'|'error'} status - Determined status
   * @param {'initiated'|'pending'|'ready'} uploadStatus - CDP upload status
   * @param {import('../cdp-upload-service.js').CdpFileData} fileData - File data object
   */
  logStatusDetermination(status, uploadStatus, fileData) {
    this.logger.debug(
      `Status determination result, ${JSON.stringify(
        {
          determinedStatus: status,
          inputs: {
            uploadStatus,
            fileStatus: fileData.fileStatus,
            hasError: fileData.hasError
          }
        },
        null,
        2
      )}`
    )
  }
}
