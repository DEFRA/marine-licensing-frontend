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
  getInvoiceAddressBackLink,
  getInvoiceCancelLink,
  isInChangeFlow,
  redirectAfterInvoiceAddressSubmit,
  withAction
} from '#src/server/marine-licence/invoicing/utils.js'
import {
  buildAddressLines,
  toInvoiceAddress
} from '#src/server/marine-licence/invoicing/confirm-address/utils.js'

export const CONFIRM_ADDRESS_VIEW_ROUTE =
  'marine-licence/invoicing/confirm-address/index'

const CONFIRM_ADDRESS_BUTTON_TEXT = 'Confirm address'

const getButtonText = (action, invoicing) =>
  isInChangeFlow(action, invoicing)
    ? 'Save and continue'
    : CONFIRM_ADDRESS_BUTTON_TEXT

// The page only means anything with a looked-up address behind it, so a deep link
// without one goes back to the search rather than confirming an empty address.
const getGuardRedirect = (invoicing, action) => {
  if (invoicing.invoiceAddressType !== INVOICE_TYPE_OPTIONS.UK) {
    return withAction(
      marineLicenceRoutes.MARINE_LICENCE_IS_INVOICE_ADDRESS_UK_OR_INTERNATIONAL,
      action
    )
  }

  if (!invoicing.selectedInvoiceAddress) {
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

    const guardRedirect = getGuardRedirect(invoicing, action)
    if (guardRedirect) {
      return h.redirect(guardRedirect)
    }

    return h.view(CONFIRM_ADDRESS_VIEW_ROUTE, {
      ...confirmAddressSettings,
      projectName: marineLicence.projectName,
      addressLines: buildAddressLines(invoicing.selectedInvoiceAddress),
      editAddressLink: withAction(
        marineLicenceRoutes.MARINE_LICENCE_INVOICE_ADDRESS_POSTCODE_SEARCH,
        action
      ),
      backLink: getInvoiceAddressBackLink(
        action,
        marineLicenceRoutes.MARINE_LICENCE_INVOICE_ADDRESS_POSTCODE_SEARCH
      ),
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

    const guardRedirect = getGuardRedirect(invoicing, action)
    if (guardRedirect) {
      return h.redirect(guardRedirect)
    }

    await setMarineLicenceCache(request, h, {
      ...marineLicence,
      invoicing: {
        ...invoicing,
        invoiceAddress: toInvoiceAddress(invoicing.selectedInvoiceAddress)
      }
    })

    return redirectAfterInvoiceAddressSubmit(request, h, action, invoicing)
  }
}
