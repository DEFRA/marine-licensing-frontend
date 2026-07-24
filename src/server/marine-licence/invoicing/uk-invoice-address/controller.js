import {
  getMarineLicenceCache,
  setMarineLicenceCache
} from '#src/server/common/helpers/marine-licence/session-cache/utils.js'
import { createFailAction } from '#src/server/common/helpers/createFailAction.js'
import { ukInvoiceAddressSchema } from '#src/server/common/validation/invoicing/uk-invoice-address/schema.js'
import {
  INVOICE_TYPE_OPTIONS,
  ukInvoiceAddressErrorMessages,
  ukInvoiceAddressSettings
} from '#src/server/common/validation/invoicing/constants.js'
import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'
import {
  getInvoiceAddressBackLink,
  getInvoiceCancelLink,
  getInvoiceAddressButtonText,
  redirectAfterInvoiceAddressSubmit
} from '#src/server/marine-licence/invoicing/utils.js'

export const UK_INVOICE_ADDRESS_VIEW_ROUTE =
  'marine-licence/invoicing/uk-invoice-address/index'

export const ukInvoiceAddressController = {
  async handler(request, h) {
    const marineLicence = getMarineLicenceCache(request)
    const { invoicing } = marineLicence

    if (invoicing.invoiceAddressType !== INVOICE_TYPE_OPTIONS.UK) {
      return h.redirect(
        marineLicenceRoutes.MARINE_LICENCE_IS_INVOICE_ADDRESS_UK_OR_INTERNATIONAL
      )
    }

    const action = request.query.action

    return h.view(UK_INVOICE_ADDRESS_VIEW_ROUTE, {
      ...ukInvoiceAddressSettings,
      projectName: marineLicence.projectName,
      payload: invoicing.invoiceAddress ?? {},
      backLink: getInvoiceAddressBackLink(action, invoicing),
      cancelLink: getInvoiceCancelLink(action, invoicing),
      buttonText: getInvoiceAddressButtonText(action, invoicing)
    })
  }
}

export const ukInvoiceAddressSubmitController = {
  options: {
    validate: {
      payload: ukInvoiceAddressSchema,
      failAction: (request, h, err) => {
        const { projectName, invoicing } = getMarineLicenceCache(request)
        const action = request.query.action

        return createFailAction({
          viewRoute: UK_INVOICE_ADDRESS_VIEW_ROUTE,
          settings: ukInvoiceAddressSettings,
          errorMessages: ukInvoiceAddressErrorMessages,
          projectName,
          backLink: getInvoiceAddressBackLink(action, invoicing),
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

    await setMarineLicenceCache(request, h, {
      ...marineLicence,
      invoicing: {
        ...invoicing,
        invoiceAddress: {
          addressLine1: payload.addressLine1,
          addressLine2: payload.addressLine2,
          addressTown: payload.addressTown,
          addressCounty: payload.addressCounty,
          addressPostcode: payload.addressPostcode
        }
      }
    })

    return redirectAfterInvoiceAddressSubmit(
      request,
      h,
      request.query.action,
      invoicing
    )
  }
}
