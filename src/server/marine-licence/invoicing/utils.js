import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'
import { saveInvoicingToBackend } from '#src/server/common/helpers/marine-licence/invoicing/save-invoicing.js'
import {
  INVOICING_ENTRY_POINT_PAGES,
  getInvoicingPageEntryPoint
} from '#src/server/common/helpers/marine-licence/session-cache/invoicing-entry-points.js'

const MINIMUM_RESULTS_FOR_PICKER = 2

export const hasPickableResults = (results) =>
  results.length >= MINIMUM_RESULTS_FOR_PICKER

export const hasSingleResult = (results) => results.length === 1

// invoicing.originalInvoiceAddressType is set when the user is in the "change UK/international" flow
export const isInAddressTypeChangeFlow = (invoicing) =>
  Boolean(invoicing?.originalInvoiceAddressType)

export const isInAddressChangeFlow = (action) => !!action

export const isInChangeFlow = (action, invoicing) => {
  return isInAddressTypeChangeFlow(invoicing) || isInAddressChangeFlow(action)
}

// In the change flow every invoice address page goes back to check-answers;
// otherwise it goes back to whichever page precedes it in the journey.
export const getInvoiceAddressBackLink = (
  action,
  previousRoute = marineLicenceRoutes.MARINE_LICENCE_IS_INVOICE_ADDRESS_UK_OR_INTERNATIONAL
) => {
  if (isInAddressChangeFlow(action)) {
    return marineLicenceRoutes.MARINE_LICENCE_CHECK_INVOICING_DETAILS
  }
  return previousRoute
}

// Links and redirects between the invoice address pages have to carry the action
// through, or a user part-way into the change flow silently drops out of it.
export const withAction = (route, action) =>
  isInAddressChangeFlow(action)
    ? `${route}?action=${encodeURIComponent(action)}`
    : route

// Several pages lead to the same invoice address page, so the page it goes back to
// is whichever one sent the user here rather than a fixed route. The change flow has
// to be carried on to an intermediate page, or going back drops out of it; the
// check-answers page ends the flow, so it is linked to bare.
const resolveInvoiceAddressBackLink = (
  request,
  pageKey,
  action,
  fallbackRoute
) => {
  const entryPoint = getInvoicingPageEntryPoint(request, pageKey)

  if (!entryPoint) {
    return getInvoiceAddressBackLink(action, fallbackRoute)
  }

  if (
    entryPoint === marineLicenceRoutes.MARINE_LICENCE_CHECK_INVOICING_DETAILS
  ) {
    return entryPoint
  }

  return withAction(entryPoint, action)
}

export const getUkInvoiceAddressBackLink = (request, action) =>
  resolveInvoiceAddressBackLink(
    request,
    INVOICING_ENTRY_POINT_PAGES.UK_INVOICE_ADDRESS,
    action,
    marineLicenceRoutes.MARINE_LICENCE_INVOICE_ADDRESS_POSTCODE_SEARCH
  )

export const getConfirmAddressBackLink = (request, action) =>
  resolveInvoiceAddressBackLink(
    request,
    INVOICING_ENTRY_POINT_PAGES.CONFIRM_ADDRESS,
    action,
    marineLicenceRoutes.MARINE_LICENCE_INVOICE_ADDRESS_POSTCODE_SEARCH
  )

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
