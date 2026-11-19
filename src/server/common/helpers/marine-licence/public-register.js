import { WITHHOLD_REASON } from '#src/server/common/validation/marine-licence-public-register/constants.js'

export const isNationalSecurity = (publicRegister) =>
  publicRegister?.withholdConsent === 'yes' &&
  publicRegister.withholdReason === WITHHOLD_REASON.NATIONAL_SECURITY

export const getNationalSecurityAnswers = (publicRegister) => {
  const { nationalSecurityApproval, reason } = publicRegister ?? {}
  return { nationalSecurityApproval, reason }
}
