import Boom from '@hapi/boom'
import { iatAnswersService } from '#src/services/iat-answers-service/iat-answers.service.js'

const VIEW_PATH = 'journey/self-service/answer/index'

export const answerController = {
  handler: async (request, h) => {
    const doc = await iatAnswersService.get(request, request.params.id)
    if (!doc) {
      throw Boom.notFound('IAT answers not found')
    }

    return h.view(VIEW_PATH, {
      pageTitle: 'IAT answers',
      heading: 'IAT answers',
      dateOfCheck: doc.createdAt,
      summaryText: doc.outcome?.summaryText ?? '',
      answers: doc.answers ?? []
    })
  }
}
