const STREET_LINE_FIELDS = [
  'subBuildingName',
  'buildingName',
  'buildingNumber',
  'street'
]

// The lookup response is external data, so a field that arrives as a number rather
// than a string must not take the page down. address-lookup.js coerces the same way.
const text = (value) => String(value ?? '').trim()

const present = (value) => text(value) !== ''

// Not every lookup result carries every field, so the parts are joined with a single
// space rather than formatted positionally.
export const buildStreetLine = (result) =>
  STREET_LINE_FIELDS.map((field) => result?.[field])
    .filter(present)
    .map(text)
    .join(' ')

export const buildAddressLines = (result) =>
  [
    buildStreetLine(result),
    result?.locality,
    result?.town,
    result?.ceremonialCounty,
    result?.postcode
  ]
    .filter(present)
    .map(text)

// A result with nothing renderable in it is no more use than no result at all, so the
// page treats it the same way rather than showing an empty address.
export const hasRenderableAddress = (result) =>
  buildAddressLines(result).length > 0

// A looked-up address is stored in the same shape as a manually entered one so the
// rest of the journey - review, save, check answers - does not need to know which it is.
export const toInvoiceAddress = (result) => ({
  addressLine1: buildStreetLine(result),
  addressLine2: text(result?.locality),
  addressTown: text(result?.town),
  addressCounty: text(result?.ceremonialCounty),
  addressPostcode: text(result?.postcode)
})
