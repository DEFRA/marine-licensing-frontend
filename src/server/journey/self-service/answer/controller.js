import Boom from '@hapi/boom'
import { iatAnswersService } from '#src/services/iat-answers-service/iat-answers.service.js'
import { getDocumentPreambleText } from '#src/server/journey/self-service/services/journey-data.js'

const VIEW_PATH = 'journey/self-service/answer/index'

export const answerController = {
  handler: async (request, h) => {
    const doc = await iatAnswersService.get(request, request.params.slug)
    if (!doc) {
      throw Boom.notFound('IAT answers not found')
    }

    return h.view(VIEW_PATH, {
      pageTitle: 'Marine licence requirement check',
      heading: 'Marine licence requirement check',
      introductionText: getDocumentPreambleText(),
      dateOfCheck: doc.createdAt,
      summaryText: doc.outcome?.summaryText ?? '',
      answers: doc.answers ?? []
    })
  }
}
