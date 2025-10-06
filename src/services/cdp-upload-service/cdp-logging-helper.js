export class CdpLoggingHelper {
  constructor(logger) {
    this.logger = logger
  }

  logCdpResponse(uploadId, data) {
    this.logger.debug(`CDP service response received for ${uploadId}`)
    this.logger.debug(`Full CDP Response: ${JSON.stringify(data, null, 2)}`)
  }

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

  logTransformationResult(result) {
    this.logger.debug(`status() returning: ${JSON.stringify(result, null, 2)}`)
  }

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
