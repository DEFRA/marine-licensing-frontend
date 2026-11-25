import {
  getReasonPage,
  isChangeMode,
  isNationalSecurity,
  withChangeQuery
} from '#src/server/marine-licence/public-register/utils.js'
import { isFromCheckYourAnswers } from '#src/server/common/helpers/marine-licence/redirect-link.js'
import { extractReferrerPath } from '#src/server/common/helpers/referrer-validation.js'
import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'
import { publicRegisterCheckAnswersText as text } from '#src/server/marine-licence/public-register/check-answers/constants.js'

const changeAction = (request, path, visuallyHiddenText) => ({
  items: [
    {
      href: withChangeQuery(request, path),
      text: 'Change',
      visuallyHiddenText,
      classes: 'govuk-link--no-visited-state'
    }
  ]
})

const getApprovalRow = (request, publicRegister) =>
  isNationalSecurity(publicRegister)
    ? {
        key: text.approvalQuestion,
        value: text.approvalAnswer[publicRegister.nationalSecurityApproval],
        actions: changeAction(
          request,
          marineLicenceRoutes.MARINE_LICENCE_PUBLIC_REGISTER_NATIONAL_SECURITY,
          text.changeHiddenText.approval
        )
      }
    : null

const hasReasonAnswer = (publicRegister) =>
  Boolean(publicRegister.reason) &&
  (!isNationalSecurity(publicRegister) ||
    publicRegister.nationalSecurityApproval === 'yes')

// National security reasons are changed through the approval row
const getReasonRowActions = (request, publicRegister) =>
  isNationalSecurity(publicRegister)
    ? null
    : changeAction(
        request,
        marineLicenceRoutes.MARINE_LICENCE_PUBLIC_REGISTER_COMMERCIAL_CONFIDENTIALITY,
        text.changeHiddenText.reason
      )

const getReasonRow = (request, publicRegister) =>
  hasReasonAnswer(publicRegister)
    ? {
        key: text.reasonQuestion[publicRegister.withholdReason],
        value: publicRegister.reason,
        actions: getReasonRowActions(request, publicRegister)
      }
    : null

export const getCheckAnswersSummary = (request, publicRegister) => ({
  withhold: {
    key: text.withholdQuestion,
    value: text.withholdAnswer[publicRegister.withholdReason],
    actions: changeAction(
      request,
      marineLicenceRoutes.MARINE_LICENCE_PUBLIC_REGISTER,
      text.changeHiddenText.withhold
    )
  },
  approval: getApprovalRow(request, publicRegister),
  reason: getReasonRow(request, publicRegister)
})

const CHECK_YOUR_ANSWERS_CARD = `${marineLicenceRoutes.MARINE_LICENCE_CHECK_YOUR_ANSWERS}#public-register-card`

export const getContinueLink = (request) =>
  isFromCheckYourAnswers(request)
    ? CHECK_YOUR_ANSWERS_CARD
    : marineLicenceRoutes.MARINE_LICENCE_TASK_LIST

export const getBackLink = (request, publicRegister) => {
  if (isFromCheckYourAnswers(request)) {
    return isChangeMode(request, publicRegister)
      ? withChangeQuery(request, getReasonPage(publicRegister))
      : CHECK_YOUR_ANSWERS_CARD
  }
  return extractReferrerPath(request.headers?.referer) ===
    marineLicenceRoutes.MARINE_LICENCE_TASK_LIST
    ? marineLicenceRoutes.MARINE_LICENCE_TASK_LIST
    : getReasonPage(publicRegister)
}
