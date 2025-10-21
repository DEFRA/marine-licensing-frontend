export class CdpLoggingHelper {
  logSystem = 'FileUpload'

  constructor(logger) {
    this.logger = logger
  }

  logDebug(message) {
    this.logger.debug(`${this.logSystem}: ${message}`)
  }

  logInfo(message) {
    this.logger.info(`${this.logSystem}: ${message}`)
  }

  logCdpResponse(uploadId, data) {
    this.logInfo(`CDP service response received for ${uploadId}`)
    this.logInfo(`Full CDP Response: ${JSON.stringify(data, null, 2)}`)
  }

  logTransformationStart(uploadStatus, form) {
    this.logInfo(`Starting response transformation`)
    this.logInfo(`Upload Status: ${uploadStatus}`)
    this.logInfo(`Form Object Count: ${form ? Object.keys(form).length : 0}`)

    if (form) {
      this.logDebug(`Form Data: ${JSON.stringify(form, null, 2)}`)
    } else {
      this.logDebug('Form Data: null')
    }
  }

  logFileDataExtraction(fileData, form) {
    this.logDebug(`File data extraction result`)
    this.logDebug(`File Data Exists: ${!!fileData}`)

    if (fileData) {
      this.logInfo(`Extracted File Data: ${JSON.stringify(fileData, null, 2)}`)
    } else {
      this.logInfo('Extracted File Data: null')
    }

    if (form && Object.keys(form).length > 0) {
      this.logDebug(
        `First Form Value: ${JSON.stringify(Object.values(form)[0], null, 2)}`
      )
    } else {
      this.logDebug('First Form Value: no form values')
    }
  }

  logTransformationResult(result) {
    this.logInfo(`status() returning: ${JSON.stringify(result, null, 2)}`)
  }

  logStatusDetermination(status, uploadStatus, fileData) {
    this.logInfo(
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
