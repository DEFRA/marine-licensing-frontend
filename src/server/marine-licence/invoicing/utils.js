import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'
import { saveInvoicingToBackend } from '#src/server/common/helpers/marine-licence/invoicing/save-invoicing.js'

export const getInvoiceAddressBackLink = (action) =>
  action
    ? marineLicenceRoutes.MARINE_LICENCE_CHECK_INVOICING_DETAILS
    : marineLicenceRoutes.MARINE_LICENCE_IS_INVOICE_ADDRESS_UK_OR_INTERNATIONAL

export const getInvoiceAddressCancelLink = (action) =>
  action ? undefined : marineLicenceRoutes.MARINE_LICENCE_TASK_LIST

export const getInvoiceAddressButtonText = (action) =>
  action ? 'Save and continue' : 'Continue'

export const redirectAfterInvoiceAddressSubmit = async (request, h, action) => {
  if (!action) {
    return h.redirect(
      marineLicenceRoutes.MARINE_LICENCE_INVOICE_CONTACT_DETAILS
    )
  }

  await saveInvoicingToBackend(request)

  return h.redirect(marineLicenceRoutes.MARINE_LICENCE_CHECK_INVOICING_DETAILS)
}
