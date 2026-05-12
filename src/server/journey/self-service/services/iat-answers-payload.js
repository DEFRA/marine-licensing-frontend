import {
  getOutcome,
  getOutcomeType,
  getQuestion
} from '#src/server/journey/self-service/services/journey-data.js'
import { getAnswers } from '#src/server/journey/self-service/services/session-answers.js'

function resolveAnswer(question, answerId) {
  const a = question.answers?.find((ans) => ans.id === answerId)
  if (!a) {
    return null
  }
  return { id: a.id, text: a.text }
}

function buildAnswerEntry(entry) {
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

function buildOutcomeBlock(outcomeRoute, outcomeTypeId) {
  const outcome = getOutcome(outcomeRoute)
  if (!outcome) {
    return null
  }
  let summaryText = outcome.text ?? ''
  if (outcomeTypeId) {
    const ot = getOutcomeType(outcomeTypeId)
    summaryText = ot?.text ?? summaryText
  }
  return {
    route: outcomeRoute,
    typeId: outcomeTypeId ?? '',
    summaryText
  }
}

export function buildIatAnswersPayload(request, outcomeRoute, outcomeTypeId) {
  const sessionAnswers = getAnswers(request)
  const answerEntries = sessionAnswers
    .filter((e) => (e.type ?? 'question') === 'question')
    .map(buildAnswerEntry)
    .filter(Boolean)

  if (answerEntries.length === 0) {
    return null
  }

  const outcomeBlock = buildOutcomeBlock(outcomeRoute, outcomeTypeId)
  if (!outcomeBlock) {
    return null
  }

  return { outcome: outcomeBlock, answers: answerEntries }
}
