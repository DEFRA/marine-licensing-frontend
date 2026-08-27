import {
  getMarineLicenceCache,
  setMarineLicenceCache
} from '#src/server/common/helpers/marine-licence/session-cache/utils.js'
import {
  INVOICE_TYPE_OPTIONS,
  confirmAddressSettings
} from '#src/server/common/validation/invoicing/constants.js'
import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'
import {
  getConfirmAddressBackLink,
  getInvoiceCancelLink,
  isInChangeFlow,
  redirectAfterInvoiceAddressSubmit,
  withAction
} from '#src/server/marine-licence/invoicing/utils.js'
import {
  buildAddressLines,
  hasRenderableAddress,
  toInvoiceAddress
} from '#src/server/marine-licence/invoicing/confirm-address/utils.js'
import {
  INVOICING_ENTRY_POINT_PAGES,
  setInvoicingPageEntryPoint
} from '#src/server/common/helpers/marine-licence/session-cache/invoicing-entry-points.js'
import { ukInvoiceAddressSchema } from '#src/server/common/validation/invoicing/uk-invoice-address/schema.js'

export const CONFIRM_ADDRESS_VIEW_ROUTE =
  'marine-licence/invoicing/confirm-address/index'

const CONFIRM_ADDRESS_BUTTON_TEXT = 'Confirm address'

const getButtonText = (action, invoicing) =>
  isInChangeFlow(action, invoicing)
    ? 'Save and continue'
    : CONFIRM_ADDRESS_BUTTON_TEXT

// The page only means anything with a looked-up address behind it, so a deep link
// without one goes back to the search rather than confirming an empty address.
const getIncompleteJourneyRedirect = (invoicing, action) => {
  if (invoicing.invoiceAddressType !== INVOICE_TYPE_OPTIONS.UK) {
    return withAction(
      marineLicenceRoutes.MARINE_LICENCE_IS_INVOICE_ADDRESS_UK_OR_INTERNATIONAL,
      action
    )
  }

  if (!hasRenderableAddress(invoicing.selectedInvoiceAddress)) {
    return withAction(
      marineLicenceRoutes.MARINE_LICENCE_INVOICE_ADDRESS_POSTCODE_SEARCH,
      action
    )
  }

  return null
}

export const confirmAddressController = {
  async handler(request, h) {
    const marineLicence = getMarineLicenceCache(request)
    const { invoicing } = marineLicence
    const action = request.query.action

    const incompleteJourneyRedirect = getIncompleteJourneyRedirect(
      invoicing,
      action
    )
    if (incompleteJourneyRedirect) {
      return h.redirect(incompleteJourneyRedirect)
    }

    return h.view(CONFIRM_ADDRESS_VIEW_ROUTE, {
      ...confirmAddressSettings,
      projectName: marineLicence.projectName,
      addressLines: buildAddressLines(invoicing.selectedInvoiceAddress),
      editAddressLink: withAction(
        marineLicenceRoutes.MARINE_LICENCE_INVOICE_ADDRESS_POSTCODE_SEARCH,
        action
      ),
      backLink: getConfirmAddressBackLink(request, action),
      cancelLink: getInvoiceCancelLink(action, invoicing),
      buttonText: getButtonText(action, invoicing)
    })
  }
}

export const confirmAddressSubmitController = {
  async handler(request, h) {
    const marineLicence = getMarineLicenceCache(request)
    const { invoicing } = marineLicence
    const action = request.query.action

    const incompleteJourneyRedirect = getIncompleteJourneyRedirect(
      invoicing,
      action
    )
    if (incompleteJourneyRedirect) {
      return h.redirect(incompleteJourneyRedirect)
    }

    const invoiceAddress = toInvoiceAddress(invoicing.selectedInvoiceAddress)

    await setMarineLicenceCache(request, h, {
      ...marineLicence,
      invoicing: {
        ...invoicing,
        invoiceAddress
      }
    })

    // The looked-up address has to satisfy the same rules as a typed one, or it is
    // rejected by the backend at the end of the journey, far from anything the user
    // can act on. Hand it to the manual entry page instead, pre-populated, so the
    // offending field can be edited and the usual error messages apply.
    if (ukInvoiceAddressSchema.validate(invoiceAddress).error) {
      // Back from there returns to the search rather than here: this page would only
      // offer the same rejected address again.
      await setInvoicingPageEntryPoint(
        request,
        h,
        INVOICING_ENTRY_POINT_PAGES.UK_INVOICE_ADDRESS,
        marineLicenceRoutes.MARINE_LICENCE_INVOICE_ADDRESS_POSTCODE_SEARCH
      )

      return h.redirect(
        withAction(
          marineLicenceRoutes.MARINE_LICENCE_UK_INVOICE_ADDRESS,
          action
        )
      )
    }

    return redirectAfterInvoiceAddressSubmit(request, h, action, invoicing)
  }
}
