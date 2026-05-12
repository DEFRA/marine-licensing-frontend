import Joi from 'joi'
import { answerController } from '#src/server/journey/self-service/answer/controller.js'

export const journeySelfServiceAnswer = {
  plugin: {
    name: 'journeySelfServiceAnswer',
    register(server) {
      server.route([
        {
          method: 'GET',
          path: '/journey/self-service/answer/{id}',
          options: {
            auth: false,
            validate: {
              params: Joi.object({
                id: Joi.string().length(24).hex().required()
              })
            }
          },
          ...answerController
        }
      ])
    }
  }
}
