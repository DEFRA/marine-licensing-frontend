import {
  withdrawExemptionController,
  withdrawExemptionSelectController,
  withdrawExemptionSubmitController
} from '#src/server/exemption/withdraw/controller.js'
import { routes } from '#src/server/common/constants/routes.js'

export const withdrawExemptionRoutes = [
  {
    method: 'GET',
    path: routes.WITHDRAW_EXEMPTION,
    ...withdrawExemptionController
  },
  {
    method: 'GET',
    path: `${routes.WITHDRAW_EXEMPTION}/{exemptionId}`,
    ...withdrawExemptionSelectController
  },
  {
    method: 'POST',
    path: routes.WITHDRAW_EXEMPTION,
    ...withdrawExemptionSubmitController
  }
]
