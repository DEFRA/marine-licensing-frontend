import {
  getMarineLicenceCache,
  setMarineLicenceCache
} from '#src/server/common/helpers/marine-licence/session-cache/utils.js'
import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'
import { createFailAction } from '#src/server/common/helpers/createFailAction.js'
import { isInvoiceAddressUkOrInternationalSchema } from '#src/server/common/validation/invoicing/is-invoice-address-uk-or-international/schema.js'
import {
  INVOICE_TYPE_OPTIONS,
  isInvoiceAddressUkOrInternationalErrorMessages,
  isInvoiceAddressUkOrInternationalSettings
} from '#src/server/common/validation/invoicing/constants.js'

export const IS_INVOICE_ADDRESS_UK_OR_INTERNATIONAL_VIEW_ROUTE =
  'marine-licence/invoicing/is-invoice-address-uk-or-international/index'

const backLink = marineLicenceRoutes.MARINE_LICENCE_TASK_LIST

export const isInvoiceAddressUkOrInternationalController = {
  async handler(request, h) {
    const marineLicence = getMarineLicenceCache(request)
    const { invoicing } = marineLicence

    return h.view(IS_INVOICE_ADDRESS_UK_OR_INTERNATIONAL_VIEW_ROUTE, {
      ...isInvoiceAddressUkOrInternationalSettings,
      projectName: marineLicence.projectName,
      payload: invoicing ?? {},
      backLink
    })
  }
}

export const isInvoiceAddressUkOrInternationalSubmitController = {
  options: {
    validate: {
      payload: isInvoiceAddressUkOrInternationalSchema,
      failAction: (request, h, err) => {
        const { projectName } = getMarineLicenceCache(request)
        return createFailAction({
          viewRoute: IS_INVOICE_ADDRESS_UK_OR_INTERNATIONAL_VIEW_ROUTE,
          settings: isInvoiceAddressUkOrInternationalSettings,
          errorMessages: isInvoiceAddressUkOrInternationalErrorMessages,
          projectName,
          backLink,
          payload: request.payload
        })(request, h, err)
      }
    }
  },
  async handler(request, h) {
    const { payload } = request
    const marineLicence = getMarineLicenceCache(request)

    await setMarineLicenceCache(request, h, {
      ...marineLicence,
      invoicing: {
        invoiceAddressType: payload.invoiceAddressType
      }
    })

    if (payload.invoiceAddressType === INVOICE_TYPE_OPTIONS.UK) {
      return h.redirect(marineLicenceRoutes.MARINE_LICENCE_UK_INVOICE_ADDRESS)
    }

    return h.redirect(
      marineLicenceRoutes.MARINE_LICENCE_INTERNATIONAL_INVOICE_ADDRESS
    )
  }
}
