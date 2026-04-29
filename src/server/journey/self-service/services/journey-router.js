export function calculateNextRoute(question, selectedAnswerIds) {
  if (question.multiSelect) {
    return calculateMultiSelectRoute(question, selectedAnswerIds)
  }
  return calculateSingleSelectRoute(question, selectedAnswerIds)
}

function calculateMultiSelectRoute(question, ids) {
  const { questionRoute, outcomeRoute, outcomeAnswerId } = question.multiSelect
  const otherSelected = ids.includes(outcomeAnswerId)
  return otherSelected
    ? { type: 'outcome', route: outcomeRoute }
    : { type: 'question', route: questionRoute }
}

function calculateSingleSelectRoute(question, ids) {
  if (ids.length !== 1) {
    throw new Error(
      `Single-select question '${question.route}' received ${ids.length} answers`
    )
  }
  const answer = question.answers.find((a) => a.id === ids[0])
  if (!answer) {
    throw new Error(`No answer '${ids[0]}' on '${question.route}'`)
  }
  if (answer.nextQuestionRoute) {
    return { type: 'question', route: answer.nextQuestionRoute }
  }
  if (answer.outcomeRoute) {
    return { type: 'outcome', route: answer.outcomeRoute }
  }
  throw new Error(`Answer '${answer.id}' on '${question.route}' has no route`)
}
