import {
  getMarineLicenceCache,
  setMarineLicenceCache
} from '#src/server/common/helpers/marine-licence/session-cache/utils.js'
import { createFailAction } from '#src/server/common/helpers/createFailAction.js'
import { invoiceAddressPostcodeSearchSchema } from '#src/server/common/validation/invoicing/invoice-address-postcode-search/schema.js'
import {
  INVOICE_TYPE_OPTIONS,
  invoiceAddressPostcodeSearchErrorMessages,
  invoiceAddressPostcodeSearchSettings
} from '#src/server/common/validation/invoicing/constants.js'
import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'
import {
  getInvoiceAddressBackLink,
  getInvoiceCancelLink,
  getInvoiceAddressButtonText,
  withAction
} from '#src/server/marine-licence/invoicing/utils.js'
import {
  hasPickableResults,
  hasSingleResult
} from '#src/server/marine-licence/invoicing/choose-your-address/utils.js'
import { lookupAddresses } from '#src/server/common/helpers/marine-licence/invoicing/address-lookup.js'
import {
  buildNoAddressesFoundError,
  buildLookupUnavailableError,
  buildTooManyAddressesError
} from '#src/server/marine-licence/invoicing/invoice-address-postcode-search/utils.js'

export const INVOICE_ADDRESS_POSTCODE_SEARCH_VIEW_ROUTE =
  'marine-licence/invoicing/invoice-address-postcode-search/index'

const getPageParams = (action, invoicing) => ({
  ...invoiceAddressPostcodeSearchSettings,
  backLink: getInvoiceAddressBackLink(action),
  cancelLink: getInvoiceCancelLink(action, invoicing),
  buttonText: getInvoiceAddressButtonText(action, invoicing),
  manualEntryLink: marineLicenceRoutes.MARINE_LICENCE_UK_INVOICE_ADDRESS
})

const getLookupErrorViewParams = ({ results, error, truncated }) => {
  if (error) {
    return buildLookupUnavailableError()
  }

  if (results.length > 0) {
    return {}
  }

  // Zero results from a truncated set means the property search was applied to only
  // part of the postcode's addresses, so "no addresses found" would be overstating it.
  if (truncated) {
    return buildTooManyAddressesError()
  }

  return buildNoAddressesFoundError()
}

export const invoiceAddressPostcodeSearchController = {
  async handler(request, h) {
    const marineLicence = getMarineLicenceCache(request)
    const { invoicing } = marineLicence

    if (invoicing.invoiceAddressType !== INVOICE_TYPE_OPTIONS.UK) {
      return h.redirect(
        marineLicenceRoutes.MARINE_LICENCE_IS_INVOICE_ADDRESS_UK_OR_INTERNATIONAL
      )
    }

    const action = request.query.action

    return h.view(INVOICE_ADDRESS_POSTCODE_SEARCH_VIEW_ROUTE, {
      ...getPageParams(action, invoicing),
      projectName: marineLicence.projectName,
      payload: invoicing.invoiceAddressSearch ?? {}
    })
  }
}

export const invoiceAddressPostcodeSearchSubmitController = {
  options: {
    validate: {
      payload: invoiceAddressPostcodeSearchSchema,
      failAction: (request, h, err) => {
        const { projectName, invoicing } = getMarineLicenceCache(request)
        const action = request.query.action
        const { backLink, ...params } = getPageParams(action, invoicing)

        return createFailAction({
          viewRoute: INVOICE_ADDRESS_POSTCODE_SEARCH_VIEW_ROUTE,
          settings: invoiceAddressPostcodeSearchSettings,
          errorMessages: invoiceAddressPostcodeSearchErrorMessages,
          projectName,
          backLink,
          payload: request.payload,
          params
        })(request, h, err)
      }
    }
  },
  async handler(request, h) {
    const { payload } = request
    const marineLicence = getMarineLicenceCache(request)
    const { invoicing } = marineLicence
    const action = request.query.action

    const invoiceAddressSearch = {
      postcode: payload.postcode,
      propertyNameOrNumber: payload.propertyNameOrNumber
    }

    const lookup = await lookupAddresses(request, invoiceAddressSearch)
    const { results, error } = lookup

    const onlyResult = !error && hasSingleResult(results) ? results[0] : null

    // Results are cached for the choose-your-address page to read, and a lone result
    // is cached as the selection for the confirm-address page, which is where the
    // user goes next in both cases. The selection is always rewritten on a successful
    // search - left in place, a selection from an earlier postcode would outlive the
    // results it came from and still be confirmable.
    // On a lookup failure the previous results and selection are kept rather than
    // discarded, so a transient outage doesn't throw away a good search.
    await setMarineLicenceCache(request, h, {
      ...marineLicence,
      invoicing: {
        ...invoicing,
        invoiceAddressSearch,
        ...(error
          ? {}
          : {
              invoiceAddressSearchResults: results,
              selectedInvoiceAddress: onlyResult
            })
      }
    })

    if (!error && hasPickableResults(results)) {
      return h.redirect(
        withAction(
          marineLicenceRoutes.MARINE_LICENCE_CHOOSE_YOUR_ADDRESS,
          action
        )
      )
    }

    if (onlyResult) {
      return h.redirect(
        withAction(marineLicenceRoutes.MARINE_LICENCE_CONFIRM_ADDRESS, action)
      )
    }

    return h.view(INVOICE_ADDRESS_POSTCODE_SEARCH_VIEW_ROUTE, {
      ...getPageParams(action, invoicing),
      projectName: marineLicence.projectName,
      payload: invoiceAddressSearch,
      ...getLookupErrorViewParams(lookup)
    })
  }
}
