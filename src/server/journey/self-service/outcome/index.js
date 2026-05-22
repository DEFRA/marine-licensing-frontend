import Joi from 'joi'
import {
  outcomeController,
  outcomePostController,
  outcomeViewAnswersController
} from '#src/server/journey/self-service/outcome/controller.js'
import { routes } from '#src/server/common/constants/routes.js'

const OUTCOME_TYPE_MAX = 400
const OUTCOME_PATH_MAX = 200

export const journeySelfServiceOutcome = {
  plugin: {
    name: 'journeySelfServiceOutcome',
    register(server) {
      server.route([
        {
          method: 'GET',
          path: routes.IAT_OUTCOME,
          options: { auth: false },
          ...outcomeController
        },
        {
          method: 'POST',
          path: routes.IAT_OUTCOME,
          options: {
            auth: false,
            validate: {
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
            validate: {
              params: Joi.object({
                outcomeTypeId: Joi.string().max(OUTCOME_TYPE_MAX).required(),
                outcomePath: Joi.string().max(OUTCOME_PATH_MAX).required()
              })
            }
          },
          ...outcomeViewAnswersController
        }
      ])
    }
  }
}
