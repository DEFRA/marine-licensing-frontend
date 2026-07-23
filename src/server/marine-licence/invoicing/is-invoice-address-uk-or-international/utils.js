import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'
import { INVOICE_TYPE_OPTIONS } from '#src/server/common/validation/invoicing/constants.js'
import { isInChangeFlow } from '#src/server/marine-licence/invoicing/utils.js'

export const getBackLink = (action, invoicing) =>
  isInChangeFlow(action, invoicing)
    ? marineLicenceRoutes.MARINE_LICENCE_CHECK_INVOICING_DETAILS
    : marineLicenceRoutes.MARINE_LICENCE_TASK_LIST

export const getAddressRouteForType = (invoiceAddressType) =>
  invoiceAddressType === INVOICE_TYPE_OPTIONS.UK
    ? marineLicenceRoutes.MARINE_LICENCE_UK_INVOICE_ADDRESS
    : marineLicenceRoutes.MARINE_LICENCE_INTERNATIONAL_INVOICE_ADDRESS

export const isAddressTypeUnchangedSinceEnteringChangeFlow = (
  invoicing,
  submittedAddressType
) => submittedAddressType === invoicing?.originalInvoiceAddressType
