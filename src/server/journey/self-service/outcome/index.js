import Joi from 'joi'
import {
  outcomeController,
  outcomePostController,
  outcomeViewAnswersController
} from '#src/server/journey/self-service/outcome/controller.js'
import { loadIatContext } from '#src/server/journey/self-service/services/load-iat-context.js'
import { slugSchema } from '#src/server/journey/self-service/schemas/slug.js'
import { routes } from '#src/server/common/constants/routes.js'

const OUTCOME_TYPE_MAX = 400
const OUTCOME_PATH_MAX = 200

const outcomeParamsSchema = Joi.object({
  slug: slugSchema,
  outcomePath: Joi.string().max(OUTCOME_PATH_MAX).required()
})

const viewAnswersParamsSchema = Joi.object({
  slug: slugSchema,
  outcomeTypeId: Joi.string().max(OUTCOME_TYPE_MAX).required(),
  outcomePath: Joi.string().max(OUTCOME_PATH_MAX).required()
})

export const journeySelfServiceOutcome = {
  plugin: {
    name: 'journeySelfServiceOutcome',
    register(server) {
      server.route([
        {
          method: 'GET',
          path: routes.IAT_OUTCOME,
          options: {
            auth: false,
            pre: [loadIatContext],
            validate: { params: outcomeParamsSchema }
          },
          ...outcomeController
        },
        {
          method: 'POST',
          path: routes.IAT_OUTCOME,
          options: {
            auth: false,
            pre: [loadIatContext],
            validate: {
              params: outcomeParamsSchema,
              payload: Joi.object({
                outcomeType: Joi.string().max(OUTCOME_TYPE_MAX).required()
              })
            }
          },
          ...outcomePostController
        },
        {
          method: 'GET',
          path: routes.IAT_OUTCOME_VIEW_ANSWERS,
          options: {
            auth: false,
            pre: [loadIatContext],
            validate: { params: viewAnswersParamsSchema }
          },
          ...outcomeViewAnswersController
        }
      ])
    }
  }
}
