import Jwt from '@hapi/jwt'
import { getOidcConfig } from '#src/server/common/plugins/auth/get-oidc-config.js'

import { getOrganisationFromToken } from '#src/server/common/plugins/auth/get-organisation-from-auth-token.js'

export const openIdProvider = async (name, authConfig) => {
  const oidcConf = await getOidcConfig(authConfig.oidcConfigurationUrl)
  return {
    name,
    protocol: 'oauth2',
    useParamsAuth: true,
    auth: oidcConf.authorization_endpoint,
    token: oidcConf.token_endpoint,
    pkce: 'S256',
    scope: authConfig.scopes,
    profile: (credentials, params) => {
      if (!credentials?.token) {
        throw new Error(
          `${name} Auth Access Token not present. Unable to retrieve profile.`
        )
      }

      const payload = Jwt.token.decode(credentials.token).decoded.payload

      const displayName = [payload.firstName, payload.lastName]
        .filter(Boolean)
        .join(' ')

      const {
        organisationId,
        organisationName,
        userRelationshipType,
        hasMultipleOrgPickerEntries,
        shouldShowOrgOrUserName
      } = getOrganisationFromToken(payload)
      let isTeamAdmin = false
      if (credentials.provider === 'entraId') {
        const { teamAdminEmails } = authConfig
        isTeamAdmin =
          payload.upn &&
          teamAdminEmails.some(
            (email) => email.toLowerCase().trim() === payload.upn.toLowerCase()
          )
      }

      credentials.profile = {
        id: payload.sub,
        correlationId: payload.correlationId,
        sessionId: payload.sessionId,
        contactId: payload.contactId,
        serviceId: payload.serviceId,
        firstName: payload.firstName,
        lastName: payload.lastName,
        displayName,
        email: payload.email,
        uniqueReference: payload.uniqueReference,
        loa: payload.loa,
        aal: payload.aal,
        enrolmentCount: payload.enrolmentCount,
        enrolmentRequestCount: payload.enrolmentRequestCount,
        currentRelationshipId: payload.currentRelationshipId,
        relationships: payload.relationships,
        organisationId,
        organisationName,
        userRelationshipType,
        hasMultipleOrgPickerEntries,
        shouldShowOrgOrUserName,
        roles: payload.roles,
        idToken: params.id_token,
        tokenUrl: oidcConf.token_endpoint,
        logoutUrl: oidcConf.end_session_endpoint,
        isTeamAdmin
      }
    }
  }
}
