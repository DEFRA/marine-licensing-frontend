import joi from 'joi'

export const MARINE_LICENCE_ID_LENGTH = 24
export const TASK_ID_LENGTH = 24

export const marineLicenceIdSchema = joi
  .string()
  .hex()
  .length(MARINE_LICENCE_ID_LENGTH)
  .required()

export const taskIdSchema = joi.string().hex().length(TASK_ID_LENGTH).required()

export const marineLicenceIdParamsSchema = joi.object({
  marineLicenceId: marineLicenceIdSchema
})

export const validateMarineLicenceIdParams = {
  validate: {
    params: marineLicenceIdParamsSchema
  }
}
