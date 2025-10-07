import Jwt from '@hapi/jwt'
import { config } from '#src/config/config.js'
import { getOidcConfig } from '#src/server/common/plugins/auth/get-oidc-config.js'

export const openIdProvider = async (name) => {
  const authConfig = config.get(name)

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
        .filter((part) => part)
        .join(' ')
      // destructure the relationships array eg
      // 81d48d6c-6e94-f011-b4cc-000d3ac28f39:27d48d6c-6e94-f011-b4cc-000d3ac28f39:CDP Child Org 1:0:Employee:0
      // which is colon-separated with the following parts:
      // relationshipId:organisationId:organisationName:organisationLoa:relationship:relationshipLoa.
      const [, applicantOrganisationId, applicantOrganisationName] =
        payload.relationships[0]?.split(':') || []

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
        applicantOrganisationId,
        applicantOrganisationName,
        roles: payload.roles,
        idToken: params.id_token,
        tokenUrl: oidcConf.token_endpoint,
        logoutUrl: oidcConf.end_session_endpoint
      }
    }
  }
}
