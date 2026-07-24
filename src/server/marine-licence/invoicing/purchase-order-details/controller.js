import {
  getMarineLicenceCache,
  setMarineLicenceCache
} from '#src/server/common/helpers/marine-licence/session-cache/utils.js'
import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'
import { createFailAction } from '#src/server/common/helpers/createFailAction.js'
import { purchaseOrderDetailsSchema } from '#src/server/common/validation/invoicing/purchase-order-details/schema.js'
import {
  purchaseOrderDetailsErrorMessages,
  purchaseOrderDetailsSettings
} from '#src/server/common/validation/invoicing/constants.js'
import { isIndividualUser } from '#src/server/common/helpers/user-session-utils.js'
import { saveInvoicingToBackend } from '#src/server/common/helpers/marine-licence/invoicing/save-invoicing.js'
import { getBackLink } from '#src/server/marine-licence/invoicing/purchase-order-details/utils.js'
import { getInvoiceCancelLink } from '#src/server/marine-licence/invoicing/utils.js'

export const PURCHASE_ORDER_DETAILS_VIEW_ROUTE =
  'marine-licence/invoicing/purchase-order-details/index'

export const purchaseOrderDetailsController = {
  async handler(request, h) {
    const marineLicence = getMarineLicenceCache(request)
    const { invoicing } = marineLicence

    const individualUser = await isIndividualUser(request)

    if (individualUser) {
      return h.redirect(marineLicenceRoutes.MARINE_LICENCE_TASK_LIST)
    }

    const action = request.query.action

    return h.view(PURCHASE_ORDER_DETAILS_VIEW_ROUTE, {
      ...purchaseOrderDetailsSettings,
      projectName: marineLicence.projectName,
      payload: invoicing.purchaseOrderDetails ?? {},
      backLink: getBackLink(action),
      cancelLink: getInvoiceCancelLink(action)
    })
  }
}

export const purchaseOrderDetailsSubmitController = {
  options: {
    validate: {
      payload: purchaseOrderDetailsSchema,
      failAction: (request, h, err) => {
        const { projectName } = getMarineLicenceCache(request)

        const action = request.query.action
        const cancelLink = getInvoiceCancelLink(action)

        return createFailAction({
          viewRoute: PURCHASE_ORDER_DETAILS_VIEW_ROUTE,
          settings: purchaseOrderDetailsSettings,
          errorMessages: purchaseOrderDetailsErrorMessages,
          projectName,
          backLink: getBackLink(action),
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

    const requiresPurchaseOrder = payload.requiresPurchaseOrder === 'yes'

    await setMarineLicenceCache(request, h, {
      ...marineLicence,
      invoicing: {
        ...invoicing,
        purchaseOrderDetails: {
          requiresPurchaseOrder: payload.requiresPurchaseOrder,
          ...(requiresPurchaseOrder && {
            purchaseOrderNumber: payload.purchaseOrderNumber
          })
        }
      }
    })

    await saveInvoicingToBackend(request)

    return h.redirect(
      marineLicenceRoutes.MARINE_LICENCE_CHECK_INVOICING_DETAILS
    )
  }
}
