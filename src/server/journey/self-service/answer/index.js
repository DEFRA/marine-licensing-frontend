import Joi from 'joi'
import { answerController } from '#src/server/journey/self-service/answer/controller.js'
import { routes } from '#src/server/common/constants/routes.js'

const SLUG_LENGTH = 22

export const journeySelfServiceAnswer = {
  plugin: {
    name: 'journeySelfServiceAnswer',
    register(server) {
      server.route([
        {
          method: 'GET',
          path: `${routes.IAT_ANSWER}/{slug}`,
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
          ...answerController
        }
      ])
    }
  }
}
