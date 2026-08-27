import {
  getMarineLicenceCache,
  setMarineLicenceCache
} from '#src/server/common/helpers/marine-licence/session-cache/utils.js'
import { createFailAction } from '#src/server/common/helpers/createFailAction.js'
import { chooseYourAddressSchema } from '#src/server/common/validation/invoicing/choose-your-address/schema.js'
import {
  chooseYourAddressErrorMessages,
  chooseYourAddressSettings
} from '#src/server/common/validation/invoicing/constants.js'
import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'
import {
  getInvoiceAddressBackLink,
  getInvoiceCancelLink,
  getInvoiceAddressButtonText,
  getMissingPrerequisiteRedirect,
  withAction,
  hasPickableResults
} from '#src/server/marine-licence/invoicing/utils.js'
import {
  INVOICING_ENTRY_POINT_PAGES,
  setInvoicingPageEntryPoint
} from '#src/server/common/helpers/marine-licence/session-cache/invoicing-entry-points.js'
import {
  NONE_OF_THESE,
  buildAddressItems,
  getSearchResults,
  getSelectedAddressValue,
  getSelectedResult
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

export const chooseYourAddressController = {
  async handler(request, h) {
    const marineLicence = getMarineLicenceCache(request)
    const { invoicing } = marineLicence
    const action = request.query.action

    const missingPrerequisiteRedirect = getMissingPrerequisiteRedirect(
      invoicing,
      action,
      hasPickableResults(getSearchResults(invoicing))
    )
    if (missingPrerequisiteRedirect) {
      return h.redirect(missingPrerequisiteRedirect)
    }

    const selectedAddress = getSelectedAddressValue(
      getSearchResults(invoicing),
      invoicing.selectedInvoiceAddress
    )

    // "None of these" leads to the UK address page from here.
    await setInvoicingPageEntryPoint(
      request,
      h,
      INVOICING_ENTRY_POINT_PAGES.UK_INVOICE_ADDRESS,
      marineLicenceRoutes.MARINE_LICENCE_CHOOSE_YOUR_ADDRESS
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
        const missingPrerequisiteRedirect = getMissingPrerequisiteRedirect(
          invoicing,
          action,
          hasPickableResults(getSearchResults(invoicing))
        )
        if (missingPrerequisiteRedirect) {
          return h.redirect(missingPrerequisiteRedirect).takeover()
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

    const missingPrerequisiteRedirect = getMissingPrerequisiteRedirect(
      invoicing,
      action,
      hasPickableResults(getSearchResults(invoicing))
    )
    if (missingPrerequisiteRedirect) {
      return h.redirect(missingPrerequisiteRedirect)
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

    await setInvoicingPageEntryPoint(
      request,
      h,
      INVOICING_ENTRY_POINT_PAGES.CONFIRM_ADDRESS,
      marineLicenceRoutes.MARINE_LICENCE_CHOOSE_YOUR_ADDRESS
    )

    return h.redirect(
      withAction(marineLicenceRoutes.MARINE_LICENCE_CONFIRM_ADDRESS, action)
    )
  }
}
