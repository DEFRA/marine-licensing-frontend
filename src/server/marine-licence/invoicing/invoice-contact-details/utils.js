import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'
import { INVOICE_TYPE_OPTIONS } from '#src/server/common/validation/invoicing/constants.js'

export const getBackLink = (invoiceAddressType, action) => {
  if (action) {
    return marineLicenceRoutes.MARINE_LICENCE_CHECK_INVOICING_DETAILS
  }

  if (invoiceAddressType === INVOICE_TYPE_OPTIONS.UK) {
    return marineLicenceRoutes.MARINE_LICENCE_UK_INVOICE_ADDRESS
  }

  return marineLicenceRoutes.MARINE_LICENCE_INTERNATIONAL_INVOICE_ADDRESS
}

export const getCancelLink = (action) =>
  action ? undefined : marineLicenceRoutes.MARINE_LICENCE_TASK_LIST

export const getButtonText = (isIndividual, action) => {
  if (action || isIndividual) {
    return 'Save and continue'
  }

  return 'Continue'
}
