export const answerChangedFromNoToYes = (previousAnswer, payload) =>
  previousAnswer === 'no' && payload.sameActivityDates === 'yes'

export const answerChangedFromYesToNo = (previousAnswer, payload) =>
  previousAnswer === 'yes' && payload.sameActivityDates === 'no'
