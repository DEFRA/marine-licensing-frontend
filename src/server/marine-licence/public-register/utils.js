const INVERTED_CONSENT = { yes: 'no', no: 'yes' }

export const toStoredPublicRegister = ({ consent, reason }) => {
  const storedConsent = INVERTED_CONSENT[consent]

  return {
    consent: storedConsent,
    ...(storedConsent === 'no' && { reason })
  }
}

export const toPublicRegisterFormValues = (publicRegister) => {
  const { consent, reason } = publicRegister ?? {}
  const formConsent = INVERTED_CONSENT[consent]

  if (!formConsent) {
    return {}
  }

  return { consent: formConsent, ...(reason && { reason }) }
}
