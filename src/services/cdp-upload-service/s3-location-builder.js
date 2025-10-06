export class S3LocationBuilder {
  static buildS3LocationObject(fileData) {
    return {
      s3Bucket: fileData.s3Bucket,
      s3Key: fileData.s3Key,
      fileId: fileData.fileId,
      s3Url: `s3://${fileData.s3Bucket}/${fileData.s3Key}`,
      detectedContentType: fileData.detectedContentType,
      checksumSha256: fileData.checksumSha256
    }
  }

  static hasRequiredS3Fields(fileData) {
    return !!(
      fileData?.s3Key &&
      fileData?.s3Bucket &&
      fileData?.fileId &&
      fileData.contentLength
    )
  }

  static isFileReadyForS3(fileData, fileStatus) {
    return (
      fileData.fileStatus === fileStatus &&
      S3LocationBuilder.hasRequiredS3Fields(fileData)
    )
  }
}
