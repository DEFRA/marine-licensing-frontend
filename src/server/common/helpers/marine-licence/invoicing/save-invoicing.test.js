import { describe, test, expect, vi, beforeEach } from 'vitest'
import { saveInvoicingToBackend } from '#src/server/common/helpers/marine-licence/invoicing/save-invoicing.js'
import { authenticatedPatchRequest } from '#src/server/common/helpers/authenticated-requests.js'
import { getMarineLicenceCache } from '#src/server/common/helpers/marine-licence/session-cache/utils.js'
import { createMockRequest } from '#src/server/test-helpers/mocks/helpers.js'
import {
    mockMarineLicenceApplication
} from '#src/server/test-helpers/mocks/marine-licence-mocks.js'
import { apiRoutes } from '#src/server/common/constants/routes.js'
import { isIndividualUser } from '#src/server/common/helpers/user-session-utils.js'

vi.mock('#src/server/common/helpers/authenticated-requests.js')
vi.mock('#src/server/common/helpers/marine-licence/session-cache/utils.js')
vi.mock('#src/server/common/helpers/user-session-utils.js')

describe('saveInvoicingToBackend', () => {
    const mockRequest = createMockRequest()

    beforeEach(() => {
        vi.mocked(getMarineLicenceCache).mockReturnValue(
            mockMarineLicenceApplication
        )
    })

    test('should save full invoicing', async () => {
        isIndividualUser.mockReturnValue(false)

        await saveInvoicingToBackend(mockRequest)

        expect(authenticatedPatchRequest).toHaveBeenCalledWith(
            mockRequest,
            apiRoutes.UPDATE_INVOICING,
            {
                ...mockMarineLicenceApplication.invoicing,
                id: mockMarineLicenceApplication.id
            }
        )
    })

    test('should save invoicing for individual user', async () => {
        isIndividualUser.mockReturnValue(true)

        await saveInvoicingToBackend(mockRequest)

        const expectedInvoicing = {
            ...mockMarineLicenceApplication.invoicing
        }
        delete expectedInvoicing.purchaseOrderDetails

        expect(authenticatedPatchRequest).toHaveBeenCalledWith(
            mockRequest,
            apiRoutes.UPDATE_INVOICING,
            {
                ...expectedInvoicing,
                id: mockMarineLicenceApplication.id
            }
        )
    })


})
