import {
  getMarineLicenceCache,
  setMarineLicenceCache
} from '#src/server/common/helpers/marine-licence/session-cache/utils.js'
import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'
import { createFailAction } from '#src/server/common/helpers/createFailAction.js'
import { invoiceContactDetailsSchema } from '#src/server/common/validation/invoicing/invoice-contact-details/schema.js'
import {
  invoiceContactDetailsErrorMessages,
  invoiceContactDetailsSettings
} from '#src/server/common/validation/invoicing/constants.js'
import { getBackLink } from '#src/server/marine-licence/invoicing/invoice-contact-details/utils.js'

export const INVOICE_CONTACT_DETAILS_VIEW_ROUTE =
  'marine-licence/invoicing/invoice-contact-details/index'

const cancelLink = marineLicenceRoutes.MARINE_LICENCE_TASK_LIST

export const invoiceContactDetailsController = {
  async handler(request, h) {
    const marineLicence = getMarineLicenceCache(request)
    const { invoicing } = marineLicence

    return h.view(INVOICE_CONTACT_DETAILS_VIEW_ROUTE, {
      ...invoiceContactDetailsSettings,
      projectName: marineLicence.projectName,
      payload: invoicing.invoiceContactDetails ?? {},
      backLink: getBackLink(invoicing.invoiceAddressType),
      cancelLink
    })
  }
}

export const invoiceContactDetailsSubmitController = {
  options: {
    validate: {
      payload: invoiceContactDetailsSchema,
      failAction: (request, h, err) => {
        const { projectName, invoicing } = getMarineLicenceCache(request)
        return createFailAction({
          viewRoute: INVOICE_CONTACT_DETAILS_VIEW_ROUTE,
          settings: invoiceContactDetailsSettings,
          errorMessages: invoiceContactDetailsErrorMessages,
          projectName,
          backLink: getBackLink(invoicing?.invoiceAddressType),
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
        invoiceContactDetails: {
          fullName: payload.fullName,
          organisationName: payload.organisationName,
          phoneNumber: payload.phoneNumber,
          emailAddress: payload.emailAddress
        }
      }
    })

    return h.redirect(
      marineLicenceRoutes.MARINE_LICENCE_INVOICE_CONTACT_DETAILS
    )
  }
}
