export function calculateNextRoute(question, selectedAnswerId) {
  const answer = question.answers.find((a) => a.id === selectedAnswerId)

  if (!answer) {
    throw new Error(
      `No answer found for id '${selectedAnswerId}' on question '${question.route}'`
    )
  }

  if (answer.nextQuestionRoute) {
    return { type: 'question', route: answer.nextQuestionRoute }
  }

  if (answer.outcomeRoute) {
    return { type: 'outcome', route: answer.outcomeRoute }
  }

  throw new Error(
    `Answer '${answer.id}' on question '${question.route}' has no nextQuestionRoute or outcomeRoute`
  )
}
