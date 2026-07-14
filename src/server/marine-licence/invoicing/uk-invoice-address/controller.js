import {
  getMarineLicenceCache,
  setMarineLicenceCache
} from '#src/server/common/helpers/marine-licence/session-cache/utils.js'
import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'
import { createFailAction } from '#src/server/common/helpers/createFailAction.js'
import { ukInvoiceAddressSchema } from '#src/server/common/validation/invoicing/uk-invoice-address/schema.js'
import {
  ukInvoiceAddressErrorMessages,
  ukInvoiceAddressSettings
} from '#src/server/common/validation/invoicing/constants.js'

export const UK_INVOICE_ADDRESS_VIEW_ROUTE =
  'marine-licence/invoicing/uk-invoice-address/index'

const backLink =
  marineLicenceRoutes.MARINE_LICENCE_IS_INVOICE_ADDRESS_UK_OR_INTERNATIONAL

const cancelLink = marineLicenceRoutes.MARINE_LICENCE_TASK_LIST

export const ukInvoiceAddressController = {
  async handler(request, h) {
    const marineLicence = getMarineLicenceCache(request)
    const { invoicing } = marineLicence

    if (invoicing.invoiceAddressType !== 'uk') {
      return h.redirect(
        marineLicenceRoutes.MARINE_LICENCE_IS_INVOICE_ADDRESS_UK_OR_INTERNATIONAL
      )
    }

    return h.view(UK_INVOICE_ADDRESS_VIEW_ROUTE, {
      ...ukInvoiceAddressSettings,
      projectName: marineLicence.projectName,
      payload: invoicing.invoiceAddress ?? {},
      backLink,
      cancelLink
    })
  }
}

export const ukInvoiceAddressSubmitController = {
  options: {
    validate: {
      payload: ukInvoiceAddressSchema,
      failAction: (request, h, err) => {
        const { projectName } = getMarineLicenceCache(request)
        return createFailAction({
          viewRoute: UK_INVOICE_ADDRESS_VIEW_ROUTE,
          settings: ukInvoiceAddressSettings,
          errorMessages: ukInvoiceAddressErrorMessages,
          projectName,
          backLink,
          payload: request.payload,
          params: { cancelLink }
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

    return h.redirect(marineLicenceRoutes.MARINE_LICENCE_UK_INVOICE_ADDRESS)
  }
}
