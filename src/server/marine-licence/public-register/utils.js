const invertConsent = (consent) => (consent === 'yes' ? 'no' : 'yes')

export const toPublicRegister = ({ consent, reason }) => {
  const storedConsent = invertConsent(consent)

  return {
    consent: storedConsent,
    ...(storedConsent === 'no' && { reason })
  }
}

export const toPublicRegisterFormValues = (publicRegister) => {
  const { consent, reason } = publicRegister ?? {}

  if (!consent) {
    return {}
  }

  return { consent: invertConsent(consent), ...(reason && { reason }) }
}
