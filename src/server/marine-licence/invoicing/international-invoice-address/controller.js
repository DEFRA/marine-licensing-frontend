import {
  getMarineLicenceCache,
  setMarineLicenceCache
} from '#src/server/common/helpers/marine-licence/session-cache/utils.js'
import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'
import { createFailAction } from '#src/server/common/helpers/createFailAction.js'
import { internationalInvoiceAddressSchema } from '#src/server/common/validation/invoicing/international-invoice-address/schema.js'
import {
  internationalInvoiceAddressErrorMessages,
  internationalInvoiceAddressSettings,
  INVOICE_TYPE_OPTIONS
} from '#src/server/common/validation/invoicing/constants.js'
import { countries } from '#src/server/common/constants/countries.js'

export const INTERNATIONAL_INVOICE_ADDRESS_VIEW_ROUTE =
  'marine-licence/invoicing/international-invoice-address/index'

const backLink =
  marineLicenceRoutes.MARINE_LICENCE_IS_INVOICE_ADDRESS_UK_OR_INTERNATIONAL

const cancelLink = marineLicenceRoutes.MARINE_LICENCE_TASK_LIST

export const internationalInvoiceAddressController = {
  async handler(request, h) {
    const marineLicence = getMarineLicenceCache(request)
    const { invoicing } = marineLicence

    if (invoicing.invoiceAddressType !== INVOICE_TYPE_OPTIONS.INTERNATIONAL) {
      return h.redirect(
        marineLicenceRoutes.MARINE_LICENCE_IS_INVOICE_ADDRESS_UK_OR_INTERNATIONAL
      )
    }

    return h.view(INTERNATIONAL_INVOICE_ADDRESS_VIEW_ROUTE, {
      ...internationalInvoiceAddressSettings,
      projectName: marineLicence.projectName,
      payload: invoicing.invoiceAddress ?? {},
      countries,
      backLink,
      cancelLink
    })
  }
}

export const internationalInvoiceAddressSubmitController = {
  options: {
    validate: {
      payload: internationalInvoiceAddressSchema,
      failAction: (request, h, err) => {
        const { projectName } = getMarineLicenceCache(request)
        return createFailAction({
          viewRoute: INTERNATIONAL_INVOICE_ADDRESS_VIEW_ROUTE,
          settings: internationalInvoiceAddressSettings,
          errorMessages: internationalInvoiceAddressErrorMessages,
          projectName,
          backLink,
          payload: request.payload,
          params: { cancelLink, countries }
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
          country: payload.country,
          address: payload.address
        }
      }
    })

    return h.redirect(
      marineLicenceRoutes.MARINE_LICENCE_INVOICE_CONTACT_DETAILS
    )
  }
}
