export const publicRegisterSchema = {
  enabled: {
    doc: 'Enable the unauthenticated public register browse page',
    format: Boolean,
    default: false,
    env: 'ENABLE_PUBLIC_REGISTER'
  },
  apiUrl: {
    doc: 'Endpoint for the marine licensing public register API service',
    format: String,
    nullable: true,
    default: 'http://localhost:3003',
    env: 'MARINE_LICENSING_PUBLIC_REGISTER_API_URL'
  }
}
