import { questionController } from '#src/server/journey/self-service/question/controller.js'
import { questionPostController } from '#src/server/journey/self-service/question/controller-post.js'
import { routes } from '#src/server/common/constants/routes.js'
import Joi from 'joi'

export const journeySelfServiceQuestion = {
  plugin: {
    name: 'journeySelfServiceQuestion',
    register(server) {
      server.route([
        {
          method: 'GET',
          path: routes.IAT_QUESTION,
          options: { auth: false },
          ...questionController
        },
        {
          method: 'POST',
          path: routes.IAT_QUESTION,
          options: {
            auth: false,
            validate: {
              payload: Joi.object({
                answer: Joi.string().max(100),
                answers: Joi.array()
                  .items(Joi.string().min(1).max(100))
                  .max(100)
                  .single()
              }).oxor('answer', 'answers')
            }
          },
          ...questionPostController
        }
      ])
    }
  }
}
