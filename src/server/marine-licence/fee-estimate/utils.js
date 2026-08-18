import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'
import { getCommonRedirectLink } from '#src/server/common/helpers/marine-licence/redirect-link.js'

export const getCancelLink = (request) => {
  const fromCheckYourAnswers = request.query?.from === 'check-your-answers'

  return fromCheckYourAnswers
    ? undefined
    : marineLicenceRoutes.MARINE_LICENCE_TASK_LIST
}

export const getContinueLink = (request) => {
  const redirectLink = getCommonRedirectLink(request)

  return redirectLink === marineLicenceRoutes.MARINE_LICENCE_TASK_LIST
    ? redirectLink
    : `${redirectLink}#fee-estimate-card`
}
