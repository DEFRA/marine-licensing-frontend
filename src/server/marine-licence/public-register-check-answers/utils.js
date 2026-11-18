import { isNationalSecurity } from '#src/server/common/helpers/marine-licence/public-register.js'
import { publicRegisterCheckAnswersText as text } from '#src/server/marine-licence/public-register-check-answers/constants.js'

const getApprovalRow = (publicRegister) =>
  isNationalSecurity(publicRegister)
    ? {
        key: text.approvalQuestion,
        value: text.approvalAnswer[publicRegister.nationalSecurityApproval]
      }
    : null

const getReasonRow = ({ withholdReason, reason }) =>
  reason ? { key: text.reasonQuestion[withholdReason], value: reason } : null

export const getCheckAnswersSummary = (publicRegister) => ({
  withhold: {
    key: text.withholdQuestion,
    value: text.withholdAnswer[publicRegister.withholdReason]
  },
  approval: getApprovalRow(publicRegister),
  reason: getReasonRow(publicRegister)
})
