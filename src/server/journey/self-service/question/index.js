import {
  questionController,
  questionPostController
} from '#src/server/journey/self-service/question/controller.js'
import { loadIatContext } from '#src/server/journey/self-service/services/load-iat-context.js'
import { routes } from '#src/server/common/constants/routes.js'
import Joi from 'joi'

const slugSchema = Joi.string()
  .pattern(/^[A-Za-z0-9_-]{22}$/)
  .required()

const QUESTION_PATH_MAX = 200

const paramsSchema = Joi.object({
  slug: slugSchema,
  questionPath: Joi.string().max(QUESTION_PATH_MAX).required()
})

export const journeySelfServiceQuestion = {
  plugin: {
    name: 'journeySelfServiceQuestion',
    register(server) {
      server.route([
        {
          method: 'GET',
          path: routes.IAT_QUESTION,
          options: {
            auth: false,
            pre: [loadIatContext],
            validate: { params: paramsSchema }
          },
          ...questionController
        },
        {
          method: 'POST',
          path: routes.IAT_QUESTION,
          options: {
            auth: false,
            pre: [loadIatContext],
            validate: {
              params: paramsSchema,
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
