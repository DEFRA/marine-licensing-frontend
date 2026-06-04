import Joi from 'joi'
import { outcomeDocumentController } from '#src/server/journey/self-service/outcome-document/controller.js'
import { slugSchema } from '#src/server/journey/self-service/schemas/slug.js'
import { routes } from '#src/server/common/constants/routes.js'

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
                slug: slugSchema
              })
            }
          },
          ...outcomeDocumentController
        }
      ])
    }
  }
}
