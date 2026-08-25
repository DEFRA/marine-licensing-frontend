export const NONE_OF_THESE = 'none'

const MINIMUM_RESULTS_FOR_PICKER = 2

export const getSearchResults = (invoicing) =>
  invoicing?.invoiceAddressSearchResults ?? []

export const hasPickableResults = (results) =>
  results.length >= MINIMUM_RESULTS_FOR_PICKER

export const buildAddressItems = (results) => [
  ...results.map((result, index) => ({
    value: String(index),
    text: result.addressLine
  })),
  { divider: 'or' },
  { value: NONE_OF_THESE, text: 'None of these' }
]

// Returns the selected result, or null when the value is not an index this result
// set has. A canonical index is required so that the value round-trips back into
// the rendered radios - a stale or tampered payload is not a real choice.
export const getSelectedResult = (results, selectedAddress) => {
  const index = Number(selectedAddress)

  if (!Number.isInteger(index) || String(index) !== selectedAddress) {
    return null
  }

  return results[index] ?? null
}

// The cached selection is matched back to its position in the current results so
// the radio the user picked last time is still the one that is pre-selected.
export const getSelectedAddressValue = (results, selectedInvoiceAddress) => {
  if (!selectedInvoiceAddress) {
    return null
  }

  const index = results.findIndex(
    (result) => result.addressLine === selectedInvoiceAddress.addressLine
  )

  return index === -1 ? null : String(index)
}
