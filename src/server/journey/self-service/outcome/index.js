import Joi from 'joi'
import {
  outcomeController,
  outcomePostController
} from '#src/server/journey/self-service/outcome/controller.js'
import { routes } from '#src/server/common/constants/routes.js'

const outcomeTypeMaxCharLength = 400

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
                outcomeType: Joi.string()
                  .max(outcomeTypeMaxCharLength)
                  .required()
              })
            }
          },
          ...outcomePostController
        }
      ])
    }
  }
}
