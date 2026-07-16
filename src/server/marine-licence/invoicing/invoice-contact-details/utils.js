import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'
import { INVOICE_TYPE_OPTIONS } from '#src/server/common/validation/invoicing/constants.js'

export const getBackLink = (invoiceAddressType) => {
  if (invoiceAddressType === INVOICE_TYPE_OPTIONS.UK) {
    return marineLicenceRoutes.MARINE_LICENCE_UK_INVOICE_ADDRESS
  }

  return marineLicenceRoutes.MARINE_LICENCE_INTERNATIONAL_INVOICE_ADDRESS
}
