import {
  getQuestion,
  getOutcomeType
} from '#src/server/journey/self-service/services/journey-data.js'

function isQuestion(entry) {
  return (entry.type ?? 'question') === 'question'
}

function isOutcome(entry) {
  return (entry.type ?? 'question') === 'outcome'
}

function mappingFromEntry(entry) {
  if (!isQuestion(entry)) {
    return null
  }
  const question = getQuestion(entry.questionRoute)
  const mapping = question?.mcmsAppFormMapping
  if (!mapping) {
    return null
  }
  const ids = Array.isArray(entry.answerIds) ? entry.answerIds : []
  if (ids.length === 0) {
    return null
  }
  return { mapping, value: ids[0] }
}

export function getMappedAnswers(answers) {
  const out = {}
  for (const entry of answers) {
    const m = mappingFromEntry(entry)
    if (m) {
      out[m.mapping] = m.value
    }
  }
  return out
}

export function getOutcomeContext(outcomeTypeId) {
  const ot = getOutcomeType(outcomeTypeId)
  const params = {}
  if (Array.isArray(ot?.params)) {
    for (const p of ot.params) {
      if (p?.name) {
        params[p.name] = p.value
      }
    }
  }
  return { outcomeTypeId, outcomeParams: params }
}

export function getChosenOutcomeTypeId(answers) {
  for (let i = answers.length - 1; i >= 0; i -= 1) {
    if (isOutcome(answers[i])) {
      return answers[i].outcomeTypeId
    }
  }
  return null
}

export function buildHandoff(doc) {
  const answers = doc?.answers ?? []
  if (answers.length === 0) {
    return null
  }
  const chosenId = getChosenOutcomeTypeId(answers)
  if (!chosenId) {
    return null
  }
  return {
    ...getOutcomeContext(chosenId),
    mappedAnswers: getMappedAnswers(answers),
    answersUrl: null
  }
}
