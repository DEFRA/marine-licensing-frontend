import {
  publicRegisterNationalSecurityController,
  publicRegisterNationalSecuritySubmitController
} from '#src/server/marine-licence/public-register-national-security/controller.js'
import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'

export const publicRegisterNationalSecurityRoutes = [
  {
    method: 'GET',
    path: marineLicenceRoutes.MARINE_LICENCE_PUBLIC_REGISTER_NATIONAL_SECURITY,
    ...publicRegisterNationalSecurityController
  },
  {
    method: 'POST',
    path: marineLicenceRoutes.MARINE_LICENCE_PUBLIC_REGISTER_NATIONAL_SECURITY,
    ...publicRegisterNationalSecuritySubmitController
  }
]
