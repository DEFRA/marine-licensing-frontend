import {
  getMarineLicenceCache,
  setMarineLicenceCache
} from '#src/server/common/helpers/marine-licence/session-cache/utils.js'
import { createFailAction } from '#src/server/common/helpers/createFailAction.js'
import { chooseYourAddressSchema } from '#src/server/common/validation/invoicing/choose-your-address/schema.js'
import {
  INVOICE_TYPE_OPTIONS,
  chooseYourAddressErrorMessages,
  chooseYourAddressSettings
} from '#src/server/common/validation/invoicing/constants.js'
import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'
import {
  getInvoiceAddressBackLink,
  getInvoiceCancelLink,
  getInvoiceAddressButtonText,
  withAction
} from '#src/server/marine-licence/invoicing/utils.js'
import {
  NONE_OF_THESE,
  buildAddressItems,
  getSearchResults,
  getSelectedAddressValue,
  getSelectedResult,
  hasPickableResults
} from '#src/server/marine-licence/invoicing/choose-your-address/utils.js'

export const CHOOSE_YOUR_ADDRESS_VIEW_ROUTE =
  'marine-licence/invoicing/choose-your-address/index'

const getPageParams = (action, invoicing) => ({
  ...chooseYourAddressSettings,
  backLink: getInvoiceAddressBackLink(
    action,
    marineLicenceRoutes.MARINE_LICENCE_INVOICE_ADDRESS_POSTCODE_SEARCH
  ),
  cancelLink: getInvoiceCancelLink(action, invoicing),
  buttonText: getInvoiceAddressButtonText(action, invoicing),
  items: buildAddressItems(getSearchResults(invoicing))
})

// The page only means anything with a multi-result search behind it, so a deep
// link without one goes back to the search rather than rendering an empty list.
const getIncompleteJourneyRedirect = (invoicing, action) => {
  if (invoicing.invoiceAddressType !== INVOICE_TYPE_OPTIONS.UK) {
    return withAction(
      marineLicenceRoutes.MARINE_LICENCE_IS_INVOICE_ADDRESS_UK_OR_INTERNATIONAL,
      action
    )
  }

  if (!hasPickableResults(getSearchResults(invoicing))) {
    return withAction(
      marineLicenceRoutes.MARINE_LICENCE_INVOICE_ADDRESS_POSTCODE_SEARCH,
      action
    )
  }

  return null
}

export const chooseYourAddressController = {
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

    const selectedAddress = getSelectedAddressValue(
      getSearchResults(invoicing),
      invoicing.selectedInvoiceAddress
    )

    return h.view(CHOOSE_YOUR_ADDRESS_VIEW_ROUTE, {
      ...getPageParams(action, invoicing),
      projectName: marineLicence.projectName,
      payload: selectedAddress ? { selectedAddress } : {}
    })
  }
}

export const chooseYourAddressSubmitController = {
  options: {
    validate: {
      payload: chooseYourAddressSchema,
      failAction: (request, h, err) => {
        const { projectName, invoicing } = getMarineLicenceCache(request)
        const action = request.query.action

        // The results can go while the form is on screen; re-rendering then would
        // show a picker with nothing in it, so the guard applies here too.
        const incompleteJourneyRedirect = getIncompleteJourneyRedirect(
          invoicing,
          action
        )
        if (incompleteJourneyRedirect) {
          return h.redirect(incompleteJourneyRedirect).takeover()
        }

        const { backLink, ...params } = getPageParams(action, invoicing)

        return createFailAction({
          viewRoute: CHOOSE_YOUR_ADDRESS_VIEW_ROUTE,
          settings: chooseYourAddressSettings,
          errorMessages: chooseYourAddressErrorMessages,
          projectName,
          backLink,
          payload: request.payload,
          params
        })(request, h, err)
      }
    }
  },
  async handler(request, h) {
    const marineLicence = getMarineLicenceCache(request)
    const { invoicing } = marineLicence
    const action = request.query.action
    const { selectedAddress } = request.payload

    const incompleteJourneyRedirect = getIncompleteJourneyRedirect(
      invoicing,
      action
    )
    if (incompleteJourneyRedirect) {
      return h.redirect(incompleteJourneyRedirect)
    }

    if (selectedAddress === NONE_OF_THESE) {
      return h.redirect(
        withAction(
          marineLicenceRoutes.MARINE_LICENCE_UK_INVOICE_ADDRESS,
          action
        )
      )
    }

    const selectedResult = getSelectedResult(
      getSearchResults(invoicing),
      selectedAddress
    )

    if (!selectedResult) {
      return h.redirect(
        withAction(
          marineLicenceRoutes.MARINE_LICENCE_INVOICE_ADDRESS_POSTCODE_SEARCH,
          action
        )
      )
    }

    // The selection is cached for the confirm-address page to read.
    await setMarineLicenceCache(request, h, {
      ...marineLicence,
      invoicing: {
        ...invoicing,
        selectedInvoiceAddress: selectedResult
      }
    })

    return h.redirect(
      withAction(marineLicenceRoutes.MARINE_LICENCE_CONFIRM_ADDRESS, action)
    )
  }
}
