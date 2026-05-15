import Joi from 'joi'
import { answerController } from '#src/server/journey/self-service/answer/controller.js'

export const journeySelfServiceAnswer = {
  plugin: {
    name: 'journeySelfServiceAnswer',
    register(server) {
      server.route([
        {
          method: 'GET',
          path: '/journey/self-service/answer/{slug}',
          options: {
            auth: false,
            validate: {
              params: Joi.object({
                slug: Joi.string()
                  .length(22)
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
