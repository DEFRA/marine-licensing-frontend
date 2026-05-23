import Boom from '@hapi/boom'
import { iatAnswersService } from '#src/services/iat-answers-service/iat-answers.service.js'
import {
  getDocumentPreambleText,
  getQuestion,
  getOutcome,
  getOutcomeType,
  getOutcomeTypesForOutcome
} from '#src/server/journey/self-service/services/journey-data.js'

const VIEW_PATH = 'journey/self-service/answer/index'

function isQuestion(entry) {
  return (entry.type ?? 'question') === 'question'
}

function isOutcome(entry) {
  return entry.type === 'outcome'
}

function resolveAnswer(question, answerId) {
  const a = question.answers?.find((ans) => ans.id === answerId)
  if (!a) {
    return null
  }
  return { id: a.id, text: a.text }
}

function buildAnswerDisplay(entry) {
  const question = getQuestion(entry.questionRoute)
  if (!question) {
    return null
  }
  const ids = Array.isArray(entry.answerIds) ? entry.answerIds : []
  const answers = ids.map((id) => resolveAnswer(question, id)).filter(Boolean)
  if (answers.length === 0) {
    return null
  }
  return {
    questionRoute: entry.questionRoute,
    questionText: question.text,
    answers
  }
}

function chosenOutcomeFromLog(answersLog) {
  for (let i = answersLog.length - 1; i >= 0; i -= 1) {
    if (isOutcome(answersLog[i])) {
      return answersLog[i]
    }
  }
  return null
}

function summaryTextFor(chosen) {
  if (!chosen) {
    return ''
  }
  const ot = getOutcomeType(chosen.outcomeTypeId)
  if (ot?.text) {
    return ot.text
  }
  const outcome = getOutcome(chosen.outcomeRoute)
  if (!outcome) {
    return ''
  }
  const types = getOutcomeTypesForOutcome(outcome)
  if (types.length === 1 && types[0].text) {
    return types[0].text
  }
  return outcome.text ?? outcome.heading ?? ''
}

export const answerController = {
  handler: async (request, h) => {
    const doc = await iatAnswersService.get(request, request.params.slug)
    if (!doc) {
      throw Boom.notFound('IAT answers not found')
    }

    const answersLog = doc.answers ?? []
    const chosen = chosenOutcomeFromLog(answersLog)

    return h.view(VIEW_PATH, {
      pageTitle: 'Marine licence requirement check',
      heading: 'Marine licence requirement check',
      introductionText: getDocumentPreambleText(),
      dateOfCheck: doc.createdAt,
      summaryText: summaryTextFor(chosen),
      answers: answersLog.filter(isQuestion).map(buildAnswerDisplay).filter(Boolean)
    })
  }
}
