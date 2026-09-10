export const toWithholdPayload = (publicRegister) => {
  if (!publicRegister?.consent) {
    return {}
  }

  const isWithholding = publicRegister.consent === 'no'

  return {
    withholdRequest: isWithholding ? 'yes' : 'no',
    ...(isWithholding && { withholdDetails: publicRegister.reason })
  }
}

export const toPublicRegister = (payload) => {
  const isWithholding = payload.withholdRequest === 'yes'

  return {
    consent: isWithholding ? 'no' : 'yes',
    ...(isWithholding && { reason: payload.withholdDetails })
  }
}

const backendFieldNames = {
  consent: 'withholdRequest',
  reason: 'withholdDetails'
}

const renameField = (field) => backendFieldNames[field] ?? field

export const mapBackendErrorFields = (details) =>
  details.map((detail) => {
    const field = detail.field ?? detail.path

    if (Array.isArray(field)) {
      return { ...detail, field: field.map(renameField) }
    }

    return { ...detail, field: renameField(field) }
  })
