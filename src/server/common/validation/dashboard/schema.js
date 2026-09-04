import joi from 'joi'
import {
  PROJECT_STATUS,
  PROJECT_TYPE
} from '#src/server/common/constants/projects.js'

export const dashboardFilterSchema = joi.object({
  show: joi.string().valid('all-projects', 'my-projects', 'specific-user'),
  user: joi.when('show', {
    is: 'specific-user',
    then: joi.array().items(joi.string().uuid()).single(),
    otherwise: joi.any().strip()
  }),
  status: joi
    .array()
    .items(joi.string().valid(...Object.keys(PROJECT_STATUS)))
    .single(),
  type: joi
    .array()
    .items(joi.string().valid(...Object.values(PROJECT_TYPE)))
    .single()
})
