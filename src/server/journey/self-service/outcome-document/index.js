import Joi from 'joi'
import { outcomeDocumentController } from '#src/server/journey/self-service/outcome-document/controller.js'
import { routes } from '#src/server/common/constants/routes.js'

const SLUG_LENGTH = 22

export const journeySelfServiceOutcomeDocument = {
  plugin: {
    name: 'journeySelfServiceOutcomeDocument',
    register(server) {
      server.route([
        {
          method: 'GET',
          path: routes.OUTCOME_DOCUMENT,
          options: {
            auth: false,
            validate: {
              params: Joi.object({
                slug: Joi.string()
                  .length(SLUG_LENGTH)
                  .pattern(/^[A-Za-z0-9_-]{22}$/)
                  .required()
              })
            }
          },
          ...outcomeDocumentController
        }
      ])
    }
  }
}
