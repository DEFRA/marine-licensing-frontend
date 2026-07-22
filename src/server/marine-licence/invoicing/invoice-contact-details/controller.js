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
import {
  getBackLink,
  getButtonText,
  getCancelLink
} from '#src/server/marine-licence/invoicing/invoice-contact-details/utils.js'
import { isIndividualUser } from '#src/server/common/helpers/user-session-utils.js'
import { USER_TYPES } from '#src/server/common/constants/user-types.js'
import { saveInvoicingToBackend } from '#src/server/common/helpers/marine-licence/invoicing/save-invoicing.js'

export const INVOICE_CONTACT_DETAILS_VIEW_ROUTE =
  'marine-licence/invoicing/invoice-contact-details/index'

const validateInvoiceContactDetailsPayload = (value, options) =>
  invoiceContactDetailsSchema.validateAsync(value, {
    ...options,
    context: {
      ...options.context,
      isIndividual:
        options.context?.auth?.credentials?.userRelationshipType ===
        USER_TYPES.CITIZEN
    }
  })

export const invoiceContactDetailsController = {
  async handler(request, h) {
    const marineLicence = getMarineLicenceCache(request)
    const { invoicing } = marineLicence
    const isIndividual = await isIndividualUser(request)

    const action = request.query.action

    return h.view(INVOICE_CONTACT_DETAILS_VIEW_ROUTE, {
      ...invoiceContactDetailsSettings,
      projectName: marineLicence.projectName,
      payload: invoicing.invoiceContactDetails ?? {},
      backLink: getBackLink(invoicing.invoiceAddressType, action),
      cancelLink: getCancelLink(action),
      isIndividual,
      buttonText: getButtonText(isIndividual, action)
    })
  }
}

export const invoiceContactDetailsSubmitController = {
  options: {
    validate: {
      payload: validateInvoiceContactDetailsPayload,
      failAction: async (request, h, err) => {
        const { projectName, invoicing } = getMarineLicenceCache(request)
        const isIndividual = await isIndividualUser(request)

        const action = request.query.action
        const cancelLink = getCancelLink(action)

        return createFailAction({
          viewRoute: INVOICE_CONTACT_DETAILS_VIEW_ROUTE,
          settings: invoiceContactDetailsSettings,
          errorMessages: invoiceContactDetailsErrorMessages,
          projectName,
          backLink: getBackLink(invoicing?.invoiceAddressType, action),
          payload: request.payload,
          params: {
            cancelLink,
            isIndividual,
            buttonText: getButtonText(isIndividual, action)
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
        invoiceContactDetails: {
          fullName: payload.fullName,
          organisationName: payload.organisationName,
          phoneNumber: payload.phoneNumber,
          emailAddress: payload.emailAddress
        }
      }
    })

    const isIndividual = await isIndividualUser(request)
    const action = request.query.action

    if (isIndividual || action) {
      await saveInvoicingToBackend(request)

      return h.redirect(
        marineLicenceRoutes.MARINE_LICENCE_CHECK_INVOICING_DETAILS
      )
    }

    return h.redirect(
      marineLicenceRoutes.MARINE_LICENCE_INVOICE_PURCHASE_ORDER_DETAILS
    )
  }
}
