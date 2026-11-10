export const marineLicencePublicRegisterSettings = {
  pageTitle: 'Withholding information from the public register',
  heading: 'Withholding information from the public register'
}

export const WITHHOLD_REASON = {
  NATIONAL_SECURITY: 'nationalSecurity',
  COMMERCIAL_CONFIDENTIALITY: 'commercialConfidentiality'
}

export const withholdReasonLabels = {
  [WITHHOLD_REASON.NATIONAL_SECURITY]: 'National security reasons',
  [WITHHOLD_REASON.COMMERCIAL_CONFIDENTIALITY]:
    'Commercial or industrial confidentiality reasons'
}

export const marineLicencePublicRegisterErrorMessages = {
  PUBLIC_REGISTER_WITHHOLD_CONSENT_REQUIRED:
    'Select whether you want to request that information is withheld',
  PUBLIC_REGISTER_WITHHOLD_REASON_REQUIRED:
    'Select a reason why you want to withhold information'
}
