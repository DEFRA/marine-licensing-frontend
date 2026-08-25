import { requiredFromEnvInCdp } from './required-from-env-in-cdp.js'

export const addressLookupSchema = {
  apiUrl: {
    doc: 'Endpoint for the DEFRA address lookup API',
    format: requiredFromEnvInCdp,
    nullable: true,
    default: 'http://localhost:3002/api/address-lookup/v2.1/addresses',
    env: 'MARINE_LICENSING_ADDRESS_LOOKUP_API_URL'
  },
  oauthTokenUrl: {
    doc: 'Full OAuth client credentials token endpoint URL for the address lookup API',
    format: requiredFromEnvInCdp,
    nullable: true,
    default: 'http://localhost:3002/oauth2/v2.0/token',
    env: 'MARINE_LICENSING_ADDRESS_LOOKUP_OAUTH_TOKEN_URL'
  },
  clientId: {
    doc: 'OAuth client id for the address lookup API',
    format: requiredFromEnvInCdp,
    nullable: true,
    default: 'local-stub-client-id',
    env: 'MARINE_LICENSING_ADDRESS_LOOKUP_CLIENT_ID'
  },
  clientSecret: {
    doc: 'OAuth client secret for the address lookup API',
    format: requiredFromEnvInCdp,
    nullable: true,
    sensitive: true,
    default: 'local-stub-client-secret',
    env: 'MARINE_LICENSING_ADDRESS_LOOKUP_CLIENT_SECRET'
  },
  clientScope: {
    doc: 'OAuth scope requested for the address lookup API',
    format: requiredFromEnvInCdp,
    nullable: true,
    default: 'api://stub/.default',
    env: 'MARINE_LICENSING_ADDRESS_LOOKUP_CLIENT_SCOPE'
  },
  maxResults: {
    doc: 'Maximum addresses requested per lookup. Sent explicitly rather than relying on the API default, because property name/number filtering happens client-side over whatever is returned',
    format: Number,
    default: 100,
    env: 'MARINE_LICENSING_ADDRESS_LOOKUP_MAX_RESULTS'
  },
  timeout: {
    doc: 'Per-request timeout in milliseconds, applied to the token request and to each lookup attempt',
    format: Number,
    default: 10000,
    env: 'MARINE_LICENSING_ADDRESS_LOOKUP_TIMEOUT'
  }
}
