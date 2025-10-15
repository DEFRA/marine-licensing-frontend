import { loginController } from '#src/server/auth/login.js'
import { signInOidcController } from '#src/server/auth/sign-in-oidc.js'
import { signOutController } from '#src/server/auth/sign-out.js'
import { loginEntraController } from '#src/server/auth/sign-in-entra.js'
import { signInOidcEntraController } from '#src/server/auth/sign-in-oidc-entra.js'
import { changeOrganisationController } from '#src/server/auth/change-organisation.js'

export const auth = {
  plugin: {
    name: 'auth_routes',
    register(server) {
      server.route([
        signInOidcController,
        signInOidcEntraController,
        loginController,
        loginEntraController,
        signOutController,
        changeOrganisationController
      ])
    }
  }
}
