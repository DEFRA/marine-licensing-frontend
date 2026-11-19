import { isNationalSecurity } from '#src/server/common/helpers/marine-licence/public-register.js'
import { publicRegisterCheckAnswersText as text } from '#src/server/marine-licence/public-register-check-answers/constants.js'

const getApprovalRow = (publicRegister) =>
  isNationalSecurity(publicRegister)
    ? {
        key: text.approvalQuestion,
        value: text.approvalAnswer[publicRegister.nationalSecurityApproval]
      }
    : null

const hasReasonAnswer = (publicRegister) =>
  Boolean(publicRegister.reason) &&
  (!isNationalSecurity(publicRegister) ||
    publicRegister.nationalSecurityApproval === 'yes')

const getReasonRow = (publicRegister) =>
  hasReasonAnswer(publicRegister)
    ? {
        key: text.reasonQuestion[publicRegister.withholdReason],
        value: publicRegister.reason
      }
    : null

export const getCheckAnswersSummary = (publicRegister) => ({
  withhold: {
    key: text.withholdQuestion,
    value: text.withholdAnswer[publicRegister.withholdReason]
  },
  approval: getApprovalRow(publicRegister),
  reason: getReasonRow(publicRegister)
})
