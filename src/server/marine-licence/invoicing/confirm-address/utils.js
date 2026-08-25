const STREET_LINE_FIELDS = [
  'subBuildingName',
  'buildingName',
  'buildingNumber',
  'street'
]

const present = (value) => Boolean(value?.trim())

// Not every lookup result carries every field, so the parts are joined with a single
// space rather than formatted positionally.
export const buildStreetLine = (result) =>
  STREET_LINE_FIELDS.map((field) => result?.[field])
    .filter(present)
    .join(' ')

export const buildAddressLines = (result) =>
  [
    buildStreetLine(result),
    result?.locality,
    result?.town,
    result?.ceremonialCounty,
    result?.postcode
  ].filter(present)

// A looked-up address is stored in the same shape as a manually entered one so the
// rest of the journey - review, save, check answers - does not need to know which it is.
export const toInvoiceAddress = (result) => ({
  addressLine1: buildStreetLine(result),
  addressLine2: result?.locality,
  addressTown: result?.town,
  addressCounty: result?.ceremonialCounty,
  addressPostcode: result?.postcode
})
