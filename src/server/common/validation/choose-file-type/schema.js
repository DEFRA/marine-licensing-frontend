import joi from 'joi'

export const chooseFileTypeSchema = joi.object({
  fileUploadType: joi.string().valid('shapefile', 'kml').required().messages({
    'any.only': 'FILE_TYPE_ENTRY_REQUIRED',
    'string.empty': 'FILE_TYPE_ENTRY_REQUIRED',
    'any.required': 'FILE_TYPE_ENTRY_REQUIRED'
  })
})
