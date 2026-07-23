import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'
import { saveInvoicingToBackend } from '#src/server/common/helpers/marine-licence/invoicing/save-invoicing.js'

// invoicing.originalInvoiceAddressType is set when the user is in the "change UK/international" flow
export const isInAddressTypeChangeFlow = (invoicing) =>
  Boolean(invoicing?.originalInvoiceAddressType)

export const isInAddressChangeFlow = (action) => !!action

export const isInChangeFlow = (action, invoicing) => {
  return isInAddressTypeChangeFlow(invoicing) || isInAddressChangeFlow(action)
}

export const getInvoiceAddressBackLink = (action, invoicing) => {
  if (isInAddressChangeFlow(action)) {
    return marineLicenceRoutes.MARINE_LICENCE_CHECK_INVOICING_DETAILS
  }
  return marineLicenceRoutes.MARINE_LICENCE_IS_INVOICE_ADDRESS_UK_OR_INTERNATIONAL
}

export const getInvoiceCancelLink = (action, invoicing) =>
  isInChangeFlow(action, invoicing)
    ? undefined
    : marineLicenceRoutes.MARINE_LICENCE_TASK_LIST

export const getInvoiceAddressButtonText = (action, invoicing) =>
  isInChangeFlow(action, invoicing) ? 'Save and continue' : 'Continue'

export const redirectAfterInvoiceAddressSubmit = async (
  request,
  h,
  action,
  invoicing
) => {
  if (!isInChangeFlow(action, invoicing)) {
    return h.redirect(
      marineLicenceRoutes.MARINE_LICENCE_INVOICE_CONTACT_DETAILS
    )
  }

  await saveInvoicingToBackend(request)

  return h.redirect(marineLicenceRoutes.MARINE_LICENCE_CHECK_INVOICING_DETAILS)
}
