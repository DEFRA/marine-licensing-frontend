import { WITHHOLD_REASON } from '#src/server/common/validation/marine-licence-public-register/constants.js'
import {
  getCommonRedirectLink,
  isFromCheckYourAnswers,
  withCheckYourAnswersQuery
} from '#src/server/common/helpers/marine-licence/redirect-link.js'
import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'

const CHANGE_ACTION = 'change'

export const isWithholdingFor = (publicRegister, withholdReason) =>
  publicRegister?.withholdConsent === 'yes' &&
  publicRegister.withholdReason === withholdReason

export const isNationalSecurity = (publicRegister) =>
  isWithholdingFor(publicRegister, WITHHOLD_REASON.NATIONAL_SECURITY)

export const isCommercialConfidentiality = (publicRegister) =>
  isWithholdingFor(publicRegister, WITHHOLD_REASON.COMMERCIAL_CONFIDENTIALITY)

export const getNationalSecurityAnswers = (publicRegister) => {
  if (!isNationalSecurity(publicRegister)) {
    return {}
  }
  const { nationalSecurityApproval, reason } = publicRegister
  return { nationalSecurityApproval, reason }
}

export const getCommercialConfidentialityAnswers = (publicRegister) =>
  isCommercialConfidentiality(publicRegister)
    ? { reason: publicRegister.reason }
    : {}

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

export const isChangeMode = (request, publicRegister) =>
  request.query?.action === CHANGE_ACTION &&
  publicRegister?.withholdConsent === 'yes' &&
  getCheckAnswersRedirect(publicRegister) === null

export const withChangeQuery = (request, path, withholdReason) => {
  const query = new URLSearchParams({ action: CHANGE_ACTION })
  if (withholdReason) {
    query.set('withholdReason', withholdReason)
  }
  if (isFromCheckYourAnswers(request)) {
    query.set('from', request.query.from)
  }
  return `${path}?${query}`
}

const isKnownWithholdReason = (value) =>
  Object.values(WITHHOLD_REASON).includes(value)

export const getPublicRegisterAnswers = (request, publicRegister) => {
  const pendingReason = request.query?.withholdReason
  if (
    isChangeMode(request, publicRegister) &&
    isKnownWithholdReason(pendingReason)
  ) {
    return { withholdConsent: 'yes', withholdReason: pendingReason }
  }
  return publicRegister ?? {}
}

export const getPublicRegisterLink = (request) =>
  withCheckYourAnswersQuery(
    request,
    marineLicenceRoutes.MARINE_LICENCE_PUBLIC_REGISTER
  )

export const getCheckAnswersLink = (request) =>
  withCheckYourAnswersQuery(
    request,
    marineLicenceRoutes.MARINE_LICENCE_PUBLIC_REGISTER_CHECK_ANSWERS
  )

export const getPublicRegisterLinks = (request, publicRegister) => {
  if (isChangeMode(request, publicRegister)) {
    return { backLink: getCheckAnswersLink(request), cancelLink: null }
  }
  const backLink = getCommonRedirectLink(request)
  return { backLink, cancelLink: backLink }
}

export const getReasonPageLinks = (request, publicRegister, withholdReason) => {
  if (!isChangeMode(request, publicRegister)) {
    return {
      backLink: getPublicRegisterLink(request),
      cancelLink: marineLicenceRoutes.MARINE_LICENCE_TASK_LIST
    }
  }
  const backLink = isWithholdingFor(publicRegister, withholdReason)
    ? getCheckAnswersLink(request)
    : withChangeQuery(
        request,
        marineLicenceRoutes.MARINE_LICENCE_PUBLIC_REGISTER,
        withholdReason
      )
  return { backLink, cancelLink: null }
}
