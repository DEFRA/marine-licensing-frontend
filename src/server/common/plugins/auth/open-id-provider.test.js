import { vi } from 'vitest'
import { openIdProvider } from '#src/server/common/plugins/auth/open-id-provider.js'
import { getOidcConfig } from '#src/server/common/plugins/auth/get-oidc-config.js'
import jwt from '@hapi/jwt'
import { config } from '#src/config/config.js'
vi.mock('~/src/server/common/plugins/auth/get-oidc-config.js')

describe('#openIdProvider', () => {
  let provider
  const defraIdAuthConfig = config.get('defraId')
  const entraIdAuthConfig = config.get('entraId')

  beforeAll(async () => {
    const oidcConf = {
      authorization_endpoint: 'http://test-auth-endpoint',
      token_endpoint: 'http://test-token-endpoint',
      end_session_endpoint: 'http://test-end-session-endpoint'
    }
    vi.mocked(getOidcConfig).mockResolvedValue(oidcConf)
  })

  test('When credentials exist with Employee relationship', async () => {
    provider = await openIdProvider('defraId', defraIdAuthConfig)
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
        enrolmentCount: 2,
        enrolmentRequestCount: 1,
        currentRelationshipId: 'testRelationshipId',
        relationships: [
          'testRelationshipId:testOrgId:Test Organisation Ltd:0:Employee:0'
        ],
        roles: ['testRoles'],
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
        enrolmentCount: 2,
        enrolmentRequestCount: 1,
        currentRelationshipId: 'testRelationshipId',
        relationships: [
          'testRelationshipId:testOrgId:Test Organisation Ltd:0:Employee:0'
        ],
        organisationId: 'testOrgId',
        organisationName: 'Test Organisation Ltd',
        userRelationshipType: 'Employee',
        hasMultipleOrgPickerEntries: true,
        roles: ['testRoles'],
        idToken: 'test-id-token',
        tokenUrl: 'http://test-token-endpoint',
        logoutUrl: 'http://test-end-session-endpoint',
        isTeamAdmin: false
      })
    )
  })

  test('When credentials exist with Agent relationship', async () => {
    provider = await openIdProvider('defraId', defraIdAuthConfig)
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
        relationships: [
          'testRelationshipId:beneficiaryOrgId:Beneficiary Organisation:0:Agent:0'
        ],
        roles: ['testRoles'],
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
        relationships: [
          'testRelationshipId:beneficiaryOrgId:Beneficiary Organisation:0:Agent:0'
        ],
        organisationId: 'beneficiaryOrgId',
        organisationName: 'Beneficiary Organisation',
        userRelationshipType: 'Agent',
        hasMultipleOrgPickerEntries: false,
        roles: ['testRoles'],
        idToken: 'test-id-token',
        tokenUrl: 'http://test-token-endpoint',
        logoutUrl: 'http://test-end-session-endpoint',
        isTeamAdmin: false
      })
    )
  })

  test('When relationships array is empty', async () => {
    provider = await openIdProvider('defraId', defraIdAuthConfig)
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
        relationships: [],
        roles: ['testRoles'],
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

    expect(credentials.profile.organisationId).toBeUndefined()
    expect(credentials.profile.organisationName).toBeUndefined()
    expect(credentials.profile.userRelationshipType).toEqual('Citizen')
    expect(credentials.profile.hasMultipleOrgPickerEntries).toEqual(false)
  })

  test('When relationships array is undefined (eg Entra ID token)', async () => {
    provider = await openIdProvider('entraId', entraIdAuthConfig)
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

    expect(credentials.profile.organisationId).toBeUndefined()
    expect(credentials.profile.organisationName).toBeUndefined()
    expect(credentials.profile.userRelationshipType).toEqual('Citizen')
    expect(credentials.profile.hasMultipleOrgPickerEntries).toEqual(false)
  })

  test('When credentials do not exist', async () => {
    provider = await openIdProvider('defraId', defraIdAuthConfig)
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

  test('add isTeamAdmin to to credentials profile if provider is entra ID and users email is in admin list', async () => {
    provider = await openIdProvider('entraId', {
      ...entraIdAuthConfig,
      teamAdminEmails: ['dev@team.com', ' user@email.com']
    })
    const token = jwt.token.generate(
      {
        sub: 'testSub',
        correlationId: 'testCorrelationId',
        sessionId: 'testSessionId',
        contactId: 'testContactId',
        serviceId: 'testServiceId',
        firstName: 'Test',
        lastName: 'User',
        upn: 'user@email.com',
        uniqueReference: 'testUniqueRef',
        loa: 'testLoa',
        aal: 'testAal',
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

    const credentials = { token, provider: 'entraId' }

    await provider.profile(credentials, { id_token: 'test' }, {})
    expect(credentials.profile.isTeamAdmin).toEqual(true)
  })
})
