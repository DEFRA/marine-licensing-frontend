import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'

const isFromCheckYourAnswers = (request) =>
  request.query?.from === 'check-your-answers'

export const withCheckYourAnswersQuery = (request, path) =>
  isFromCheckYourAnswers(request) ? `${path}?from=check-your-answers` : path

export const getCommonRedirectLink = (request) => {
  return isFromCheckYourAnswers(request)
    ? marineLicenceRoutes.MARINE_LICENCE_CHECK_YOUR_ANSWERS
    : marineLicenceRoutes.MARINE_LICENCE_TASK_LIST
}
