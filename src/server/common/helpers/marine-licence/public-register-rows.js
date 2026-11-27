import escapeHtml from 'lodash/escape.js'
import { WITHHOLD_REASON } from '#src/server/common/validation/marine-licence-public-register/constants.js'
import { publicRegisterCheckAnswersText as text } from '#src/server/marine-licence/public-register/check-answers/constants.js'
import {
  isCommercialConfidentiality,
  isNationalSecurity
} from '#src/server/marine-licence/public-register/utils.js'

const NO_BORDER_CLASS = 'govuk-summary-list__row--no-border'

const publicRegisterSummaryText = {
  withholdAnswer: {
    yes: 'Yes',
    no: 'No'
  },
  approvalAnswer: {
    yes: 'Yes',
    no: 'No – Without approval, we cannot withhold information for national security reasons. We will publish it with the rest of your application. If you get approval before you submit, you can come back and change your answer.'
  }
}

const isAnswered = (publicRegister) =>
  ['yes', 'no'].includes(publicRegister?.withholdConsent)

const multilineHtml = (value) => escapeHtml(value).replaceAll('\n', '<br>')

const getWithholdAnswer = ({ withholdConsent, withholdReason }) =>
  withholdConsent === 'yes'
    ? (text.withholdAnswer[withholdReason] ??
      publicRegisterSummaryText.withholdAnswer.yes)
    : publicRegisterSummaryText.withholdAnswer.no

const getWithholdRow = (publicRegister) =>
  isAnswered(publicRegister)
    ? {
        key: { text: text.withholdQuestion },
        value: { text: getWithholdAnswer(publicRegister) }
      }
    : {
        key: { text: text.withholdQuestion },
        isIncomplete: true
      }

const getReasonRow = (label, reason) => ({
  key: { text: label },
  value: { html: multilineHtml(reason) }
})

const getNationalSecurityRows = ({ nationalSecurityApproval, reason }) => {
  const hasApproval = nationalSecurityApproval === 'yes'
  const approvalRow = {
    key: { text: text.approvalQuestion },
    value: {
      text:
        publicRegisterSummaryText.approvalAnswer[nationalSecurityApproval] ?? ''
    }
  }

  if (!hasApproval || !reason) {
    return [approvalRow]
  }

  return [
    { ...approvalRow, classes: NO_BORDER_CLASS },
    getReasonRow(text.reasonQuestion[WITHHOLD_REASON.NATIONAL_SECURITY], reason)
  ]
}

const getFollowUpRows = (publicRegister) => {
  if (isNationalSecurity(publicRegister)) {
    return getNationalSecurityRows(publicRegister)
  }

  return isCommercialConfidentiality(publicRegister) && publicRegister.reason
    ? [
        getReasonRow(
          text.reasonQuestion[WITHHOLD_REASON.COMMERCIAL_CONFIDENTIALITY],
          publicRegister.reason
        )
      ]
    : []
}

export const buildPublicRegisterRows = (publicRegister) => {
  const withholdRow = getWithholdRow(publicRegister)
  return withholdRow.isIncomplete
    ? [withholdRow]
    : [withholdRow, ...getFollowUpRows(publicRegister)]
}
