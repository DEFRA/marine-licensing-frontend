import joi from 'joi'
import {
  PROJECT_STATUS,
  PROJECT_TYPE
} from '#src/server/common/constants/projects.js'

export const dashboardFilterSchema = joi.object({
  show: joi.string().valid('all-projects', 'my-projects'),
  status: joi
    .array()
    .items(joi.string().valid(...Object.keys(PROJECT_STATUS)))
    .single(),
  type: joi
    .array()
    .items(joi.string().valid(...Object.values(PROJECT_TYPE)))
    .single()
})
