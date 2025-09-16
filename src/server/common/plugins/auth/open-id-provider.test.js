import { openIdProvider } from '~/src/server/common/plugins/auth/open-id-provider.js'
import { getOidcConfig } from '~/src/server/common/plugins/auth/get-oidc-config.js'
import expect from 'expect'
import jwt from '@hapi/jwt'
jest.mock('~/src/server/common/plugins/auth/get-oidc-config.js')

describe('#openIdProvider', () => {
  let provider

  beforeAll(async () => {
    const oidcConf = {
      authorization_endpoint: 'http://test-auth-endpoint',
      token_endpoint: 'http://test-token-endpoint',
      end_session_endpoint: 'http://test-end-session-endpoint'
    }
    jest.mocked(getOidcConfig).mockResolvedValue(oidcConf)
    provider = await openIdProvider('defraId')
  })

  test('When credentials exist', async () => {
    const token = jwt.token.generate(
      {
        sub: 'testSub',
        correlationId: 'testCorrelationId',
        sessionId: 'testSessionId',
        contactId: 'testContactId',
        serviceId: 'testServiceId',
        firstName: 'Test',
        lastName: 'User',
        email: 'testEmail',
        uniqueReference: 'testUniqueRef',
        loa: 'testLoa',
        aal: 'testAal',
        enrolmentCount: 1,
        enrolmentRequestCount: 1,
        currentRelationshipId: 'testRelationshipId',
        relationships: 'testRelationships',
        roles: 'testRoles',
        aud: 'test',
        iss: 'test',
        user: 'Test User'
      },
      {
        key: 'test',
        algorithm: 'HS256'
      },
      {
        ttlSec: 1
      }
    )

    const credentials = { token }

    await provider.profile(credentials, { id_token: 'test-id-token' }, {})

    expect(credentials.profile).not.toBeNull()
    expect(credentials.profile).toEqual(
      expect.objectContaining({
        id: 'testSub',
        correlationId: 'testCorrelationId',
        sessionId: 'testSessionId',
        contactId: 'testContactId',
        serviceId: 'testServiceId',
        firstName: 'Test',
        lastName: 'User',
        displayName: 'Test User',
        email: 'testEmail',
        uniqueReference: 'testUniqueRef',
        loa: 'testLoa',
        aal: 'testAal',
        enrolmentCount: 1,
        enrolmentRequestCount: 1,
        currentRelationshipId: 'testRelationshipId',
        relationships: 'testRelationships',
        roles: 'testRoles',
        idToken: 'test-id-token',
        tokenUrl: 'http://test-token-endpoint',
        logoutUrl: 'http://test-end-session-endpoint'
      })
    )
  })

  test('When credential do not exist', () => {
    expect(() => provider.profile({ credentials: null }, {}, {})).toThrow(
      'defraId Auth Access Token not present. Unable to retrieve profile.'
    )
    expect(() => provider.profile({ credentials: {} }, {}, {})).toThrow(
      'defraId Auth Access Token not present. Unable to retrieve profile.'
    )
    expect(() =>
      provider.profile({ credentials: { token: null } }, {}, {})
    ).toThrow(
      'defraId Auth Access Token not present. Unable to retrieve profile.'
    )
  })
})
