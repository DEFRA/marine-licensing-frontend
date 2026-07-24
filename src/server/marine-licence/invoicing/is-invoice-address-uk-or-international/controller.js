import {
  getMarineLicenceCache,
  setMarineLicenceCache
} from '#src/server/common/helpers/marine-licence/session-cache/utils.js'
import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'
import { createFailAction } from '#src/server/common/helpers/createFailAction.js'
import { isInvoiceAddressUkOrInternationalSchema } from '#src/server/common/validation/invoicing/is-invoice-address-uk-or-international/schema.js'
import {
  isInvoiceAddressUkOrInternationalErrorMessages,
  isInvoiceAddressUkOrInternationalSettings
} from '#src/server/common/validation/invoicing/constants.js'
import {
  getInvoiceCancelLink,
  getInvoiceAddressButtonText,
  isInChangeFlow
} from '#src/server/marine-licence/invoicing/utils.js'
import {
  getBackLink,
  getAddressRouteForType,
  isAddressTypeUnchangedSinceEnteringChangeFlow
} from '#src/server/marine-licence/invoicing/is-invoice-address-uk-or-international/utils.js'

export const IS_INVOICE_ADDRESS_UK_OR_INTERNATIONAL_VIEW_ROUTE =
  'marine-licence/invoicing/is-invoice-address-uk-or-international/index'

export const isInvoiceAddressUkOrInternationalController = {
  async handler(request, h) {
    const marineLicence = getMarineLicenceCache(request)
    const { invoicing } = marineLicence
    const action = request.query.action

    return h.view(IS_INVOICE_ADDRESS_UK_OR_INTERNATIONAL_VIEW_ROUTE, {
      ...isInvoiceAddressUkOrInternationalSettings,
      projectName: marineLicence.projectName,
      payload: invoicing ?? {},
      backLink: getBackLink(action, invoicing),
      cancelLink: getInvoiceCancelLink(action, invoicing),
      buttonText: getInvoiceAddressButtonText(action, invoicing)
    })
  }
}

export const isInvoiceAddressUkOrInternationalSubmitController = {
  options: {
    validate: {
      payload: isInvoiceAddressUkOrInternationalSchema,
      failAction: (request, h, err) => {
        const marineLicence = getMarineLicenceCache(request)
        const { invoicing, projectName } = marineLicence

        const action = request.query.action

        return createFailAction({
          viewRoute: IS_INVOICE_ADDRESS_UK_OR_INTERNATIONAL_VIEW_ROUTE,
          settings: isInvoiceAddressUkOrInternationalSettings,
          errorMessages: isInvoiceAddressUkOrInternationalErrorMessages,
          projectName,
          backLink: getBackLink(action),
          payload: request.payload,
          params: {
            cancelLink: getInvoiceCancelLink(action, invoicing),
            buttonText: getInvoiceAddressButtonText(action, invoicing)
          }
        })(request, h, err)
      }
    }
  },
  async handler(request, h) {
    const { payload } = request
    const marineLicence = getMarineLicenceCache(request)
    const { invoicing } = marineLicence
    const action = request.query.action

    const changeFlowActive = isInChangeFlow(action, invoicing)
    const saveOriginalValue =
      changeFlowActive && !invoicing?.originalInvoiceAddressType

    const updatedCacheInvoicing = {
      ...invoicing,
      invoiceAddressType: payload.invoiceAddressType,
      ...(saveOriginalValue && {
        originalInvoiceAddressType: invoicing?.invoiceAddressType
      })
    }

    await setMarineLicenceCache(request, h, {
      ...marineLicence,
      invoicing: updatedCacheInvoicing
    })

    const addressRoute = getAddressRouteForType(payload.invoiceAddressType)

    if (!changeFlowActive) {
      return h.redirect(addressRoute)
    }

    if (
      isAddressTypeUnchangedSinceEnteringChangeFlow(
        updatedCacheInvoicing,
        payload.invoiceAddressType
      )
    ) {
      return h.redirect(
        marineLicenceRoutes.MARINE_LICENCE_CHECK_INVOICING_DETAILS
      )
    }

    return h.redirect(addressRoute)
  }
}
