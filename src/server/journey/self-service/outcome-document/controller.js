import Boom from '@hapi/boom'
import { iatOutcomeDocumentService } from '#src/services/iat-service/iat-outcome-document.service.js'

const VIEW_PATH = 'journey/self-service/outcome-document/index'

function buildAnswerDisplay(entry) {
  const answers = entry.answers ?? []
  if (answers.length === 0) {
    return null
  }
  return {
    questionRoute: entry.questionRoute,
    questionText: entry.questionText,
    answers: answers.map((a) => ({ id: a.id, text: a.text }))
  }
}

export const outcomeDocumentController = {
  handler: async (request, h) => {
    const doc = await iatOutcomeDocumentService.get(
      request,
      request.params.slug
    )
    if (!doc) {
      throw Boom.notFound('Outcome document not found')
    }

    const questionLog = doc.questionLog ?? []

    return h.view(VIEW_PATH, {
      pageTitle: 'Marine licence requirement check',
      heading: 'Marine licence requirement check',
      introductionText:
        'This is a record of the questions you answered when checking whether you need a marine licence, and the recommendation you were given.',
      dateOfCheck: doc.capturedAt,
      summaryText: doc.focusedOption?.text ?? '',
      answers: questionLog.map(buildAnswerDisplay).filter(Boolean)
    })
  }
}
