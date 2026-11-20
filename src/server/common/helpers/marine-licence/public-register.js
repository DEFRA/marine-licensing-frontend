import { WITHHOLD_REASON } from '#src/server/common/validation/marine-licence-public-register/constants.js'
import { withCheckYourAnswersQuery } from '#src/server/common/helpers/marine-licence/redirect-link.js'
import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'

const isWithholdingFor = (publicRegister, withholdReason) =>
  publicRegister?.withholdConsent === 'yes' &&
  publicRegister.withholdReason === withholdReason

export const isNationalSecurity = (publicRegister) =>
  isWithholdingFor(publicRegister, WITHHOLD_REASON.NATIONAL_SECURITY)

export const isCommercialConfidentiality = (publicRegister) =>
  isWithholdingFor(publicRegister, WITHHOLD_REASON.COMMERCIAL_CONFIDENTIALITY)

export const getNationalSecurityAnswers = (publicRegister) => {
  const { nationalSecurityApproval, reason } = publicRegister ?? {}
  return { nationalSecurityApproval, reason }
}

export const keepReasonAnswers = (publicRegister, existing) => {
  if (
    publicRegister.withholdConsent !== 'yes' ||
    !isWithholdingFor(existing, publicRegister.withholdReason)
  ) {
    return publicRegister
  }
  const { nationalSecurityApproval, reason } = existing
  return {
    ...publicRegister,
    ...(nationalSecurityApproval && { nationalSecurityApproval }),
    ...(reason && { reason })
  }
}

const reasonPages = {
  [WITHHOLD_REASON.NATIONAL_SECURITY]:
    marineLicenceRoutes.MARINE_LICENCE_PUBLIC_REGISTER_NATIONAL_SECURITY,
  [WITHHOLD_REASON.COMMERCIAL_CONFIDENTIALITY]:
    marineLicenceRoutes.MARINE_LICENCE_PUBLIC_REGISTER_COMMERCIAL_CONFIDENTIALITY
}

export const getReasonPage = (publicRegister) =>
  publicRegister?.withholdConsent === 'yes'
    ? reasonPages[publicRegister.withholdReason]
    : null

export const getCheckAnswersRedirect = (publicRegister) => {
  if (isNationalSecurity(publicRegister)) {
    return publicRegister.nationalSecurityApproval
      ? null
      : marineLicenceRoutes.MARINE_LICENCE_PUBLIC_REGISTER_NATIONAL_SECURITY
  }

  if (isCommercialConfidentiality(publicRegister)) {
    return publicRegister.reason
      ? null
      : marineLicenceRoutes.MARINE_LICENCE_PUBLIC_REGISTER_COMMERCIAL_CONFIDENTIALITY
  }

  return marineLicenceRoutes.MARINE_LICENCE_PUBLIC_REGISTER
}

export const getReasonPageLinks = (request) => ({
  backLink: withCheckYourAnswersQuery(
    request,
    marineLicenceRoutes.MARINE_LICENCE_PUBLIC_REGISTER
  ),
  cancelLink: marineLicenceRoutes.MARINE_LICENCE_TASK_LIST
})
