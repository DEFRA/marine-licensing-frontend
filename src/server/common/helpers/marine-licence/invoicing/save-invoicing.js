import { apiRoutes } from '#src/server/common/constants/routes.js'
import { authenticatedPatchRequest } from '#src/server/common/helpers/authenticated-requests.js'
import { getMarineLicenceCache } from '#src/server/common/helpers/marine-licence/session-cache/utils.js'
import { isIndividualUser } from '#src/server/common/helpers/user-session-utils.js'

export const saveInvoicingToBackend = async (request) => {
    const marineLicence = getMarineLicenceCache(request)

    const { invoicing } = marineLicence

    const { purchaseOrderDetails } = invoicing

    const individualUser = await isIndividualUser(request)

    const { invoiceContactDetails, invoiceAddressType, invoiceAddress } =
        invoicing

    const dataToSave = {
        invoiceContactDetails, invoiceAddressType, invoiceAddress, ...(individualUser ? {} : { purchaseOrderDetails })
    }

    await authenticatedPatchRequest(
        request,
        apiRoutes.UPDATE_INVOICING,
        {
            ...dataToSave,
            id: marineLicence.id
        }
    )
}
