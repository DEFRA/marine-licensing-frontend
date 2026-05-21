import {
  getOutcome,
  getOutcomeType,
  getOutcomeTypesForOutcome,
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

function chooseTypeId(outcomeTypeId, types, outcomeRoute) {
  if (outcomeTypeId) {
    return outcomeTypeId
  }
  if (types.length === 1) {
    return types[0].id
  }
  return outcomeRoute
}

function chooseSummaryText(outcomeTypeId, types, outcome) {
  if (outcomeTypeId) {
    const ot = getOutcomeType(outcomeTypeId)
    if (ot?.text) {
      return ot.text
    }
  }
  const isIntermediate = types.some((t) => t?.nextQuestionRoute)
  if (isIntermediate) {
    const firstTypeWithText = types.find((t) => t?.text)
    if (firstTypeWithText) {
      return firstTypeWithText.text
    }
  }
  if (types.length === 1 && types[0].text) {
    return types[0].text
  }
  if (outcome.text) {
    return outcome.text
  }
  return outcome.heading ?? ''
}

function buildOutcomeBlock(outcomeRoute, outcomeTypeId) {
  const outcome = getOutcome(outcomeRoute)
  if (!outcome) {
    return null
  }
  const types = getOutcomeTypesForOutcome(outcome)
  return {
    route: outcomeRoute,
    typeId: chooseTypeId(outcomeTypeId, types, outcomeRoute),
    summaryText: chooseSummaryText(outcomeTypeId, types, outcome)
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
