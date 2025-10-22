import { getOrganisationFromToken } from '#src/server/common/plugins/auth/get-organisation-from-auth-token.js'

const errorLogger = vi.fn()
vi.mock('#src/server/common/helpers/logging/logger.js', () => ({
  createLogger: vi.fn(() => ({ error: errorLogger }))
}))

describe('#getOrganisationFromToken', () => {
  describe('Employee relationship type', () => {
    test('When token has valid Employee relationship data', () => {
      const decodedToken = {
        currentRelationshipId: '81d48d6c-6e94-f011-b4cc-000d3ac28f39',
        relationships: [
          '81d48d6c-6e94-f011-b4cc-000d3ac28f39:27d48d6c-6e94-f011-b4cc-000d3ac28f39:CDP Child Org 1:0:Employee:0'
        ],
        enrolmentCount: 1,
        roles: ['role1']
      }

      const result = getOrganisationFromToken(decodedToken)

      expect(result).toEqual({
        organisationId: '27d48d6c-6e94-f011-b4cc-000d3ac28f39',
        organisationName: 'CDP Child Org 1',
        userRelationshipType: 'Employee',
        hasMultipleOrgPickerEntries: false,
        shouldShowOrgOrUserName: true
      })
    })

    test('When Employee has multiple organisations (enrolmentCount > roles.length)', () => {
      const decodedToken = {
        currentRelationshipId: '81d48d6c-6e94-f011-b4cc-000d3ac28f39',
        relationships: [
          '81d48d6c-6e94-f011-b4cc-000d3ac28f39:27d48d6c-6e94-f011-b4cc-000d3ac28f39:CDP Child Org 1:0:Employee:0'
        ],
        enrolmentCount: 3,
        roles: ['role1']
      }

      const result = getOrganisationFromToken(decodedToken)

      expect(result).toEqual({
        organisationId: '27d48d6c-6e94-f011-b4cc-000d3ac28f39',
        organisationName: 'CDP Child Org 1',
        userRelationshipType: 'Employee',
        hasMultipleOrgPickerEntries: true,
        shouldShowOrgOrUserName: true
      })
    })

    test('When Employee has multiple organisations (relationships.length > 1)', () => {
      const decodedToken = {
        currentRelationshipId: '81d48d6c-6e94-f011-b4cc-000d3ac28f39',
        relationships: [
          '81d48d6c-6e94-f011-b4cc-000d3ac28f39:27d48d6c-6e94-f011-b4cc-000d3ac28f39:CDP Child Org 1:0:Employee:0',
          '91d48d6c-6e94-f011-b4cc-000d3ac28f39:37d48d6c-6e94-f011-b4cc-000d3ac28f39:CDP Child Org 2:0:Employee:0'
        ],
        enrolmentCount: 2,
        roles: ['role1', 'role2']
      }

      const result = getOrganisationFromToken(decodedToken)

      expect(result).toEqual({
        organisationId: '27d48d6c-6e94-f011-b4cc-000d3ac28f39',
        organisationName: 'CDP Child Org 1',
        userRelationshipType: 'Employee',
        hasMultipleOrgPickerEntries: true,
        shouldShowOrgOrUserName: true
      })
    })
  })

  describe('Agent (Intermediary) relationship type', () => {
    test('When token has valid Agent relationship data', () => {
      const decodedToken = {
        currentRelationshipId: '81d48d6c-6e94-f011-b4cc-000d3ac28f39',
        relationships: [
          '81d48d6c-6e94-f011-b4cc-000d3ac28f39:27d48d6c-6e94-f011-b4cc-000d3ac28f39:CDP Beneficiary Org:0:Agent:0'
        ],
        enrolmentCount: 1,
        roles: ['role1']
      }

      const result = getOrganisationFromToken(decodedToken)

      expect(result).toEqual({
        organisationId: '27d48d6c-6e94-f011-b4cc-000d3ac28f39',
        organisationName: 'CDP Beneficiary Org',
        userRelationshipType: 'Agent',
        hasMultipleOrgPickerEntries: false,
        shouldShowOrgOrUserName: false
      })
    })

    test('When Agent has multiple organisations', () => {
      const decodedToken = {
        currentRelationshipId: '81d48d6c-6e94-f011-b4cc-000d3ac28f39',
        relationships: [
          '81d48d6c-6e94-f011-b4cc-000d3ac28f39:27d48d6c-6e94-f011-b4cc-000d3ac28f39:CDP Beneficiary Org:0:Agent:0',
          '91d48d6c-6e94-f011-b4cc-000d3ac28f39:37d48d6c-6e94-f011-b4cc-000d3ac28f39:CDP Beneficiary Org 2:0:Agent:0'
        ],
        enrolmentCount: 2,
        roles: ['role1', 'role2']
      }

      const result = getOrganisationFromToken(decodedToken)

      expect(result).toEqual({
        organisationId: '27d48d6c-6e94-f011-b4cc-000d3ac28f39',
        organisationName: 'CDP Beneficiary Org',
        userRelationshipType: 'Agent',
        hasMultipleOrgPickerEntries: true,
        shouldShowOrgOrUserName: true
      })
    })
  })

  describe('No organisation relationship', () => {
    test('When relationship type is neither Employee nor Agent', () => {
      const decodedToken = {
        currentRelationshipId: '81d48d6c-6e94-f011-b4cc-000d3ac28f39',
        relationships: [
          '81d48d6c-6e94-f011-b4cc-000d3ac28f39:27d48d6c-6e94-f011-b4cc-000d3ac28f39:CDP Org:0:Citizen:0'
        ],
        enrolmentCount: 1,
        roles: ['role1']
      }

      const result = getOrganisationFromToken(decodedToken)

      expect(result).toEqual({
        organisationId: '27d48d6c-6e94-f011-b4cc-000d3ac28f39',
        organisationName: 'CDP Org',
        userRelationshipType: 'Citizen',
        hasMultipleOrgPickerEntries: false,
        shouldShowOrgOrUserName: false
      })
    })
  })

  describe('Invalid or missing data', () => {
    test('When currentRelationshipId is missing', () => {
      const decodedToken = {
        relationships: [
          '81d48d6c-6e94-f011-b4cc-000d3ac28f39:27d48d6c-6e94-f011-b4cc-000d3ac28f39:CDP Child Org 1:0:Employee:0'
        ],
        enrolmentCount: 1,
        roles: ['role1']
      }

      const result = getOrganisationFromToken(decodedToken)

      expect(result).toEqual({
        hasMultipleOrgPickerEntries: false,
        userRelationshipType: 'Citizen'
      })
    })

    test('When enrolmentCount is missing', () => {
      const decodedToken = {
        currentRelationshipId: '81d48d6c-6e94-f011-b4cc-000d3ac28f39',
        relationships: [
          '81d48d6c-6e94-f011-b4cc-000d3ac28f39:27d48d6c-6e94-f011-b4cc-000d3ac28f39:CDP Child Org 1:0:Employee:0'
        ],
        roles: ['role1']
      }

      const result = getOrganisationFromToken(decodedToken)

      expect(result).toEqual({
        hasMultipleOrgPickerEntries: false,
        userRelationshipType: 'Citizen'
      })
    })

    test('When relationships is not an array', () => {
      const decodedToken = {
        currentRelationshipId: '81d48d6c-6e94-f011-b4cc-000d3ac28f39',
        relationships: 'not-an-array',
        enrolmentCount: 1,
        roles: ['role1']
      }

      const result = getOrganisationFromToken(decodedToken)

      expect(result).toEqual({
        hasMultipleOrgPickerEntries: false,
        userRelationshipType: 'Citizen'
      })
    })

    test('When roles is not an array', () => {
      const decodedToken = {
        currentRelationshipId: '81d48d6c-6e94-f011-b4cc-000d3ac28f39',
        relationships: [
          '81d48d6c-6e94-f011-b4cc-000d3ac28f39:27d48d6c-6e94-f011-b4cc-000d3ac28f39:CDP Child Org 1:0:Employee:0'
        ],
        enrolmentCount: 1,
        roles: 'not-an-array'
      }

      const result = getOrganisationFromToken(decodedToken)

      expect(result).toEqual({
        hasMultipleOrgPickerEntries: false,
        userRelationshipType: 'Citizen'
      })
    })

    test('When no matching relationship is found', () => {
      const decodedToken = {
        currentRelationshipId: 'non-matching-id',
        relationships: [
          '81d48d6c-6e94-f011-b4cc-000d3ac28f39:27d48d6c-6e94-f011-b4cc-000d3ac28f39:CDP Child Org 1:0:Employee:0'
        ],
        enrolmentCount: 1,
        roles: ['role1']
      }

      const result = getOrganisationFromToken(decodedToken)

      expect(result).toEqual({
        organisationId: undefined,
        organisationName: undefined,
        userRelationshipType: 'Citizen',
        hasMultipleOrgPickerEntries: false,
        shouldShowOrgOrUserName: false
      })
    })

    test('When relationships array is empty', () => {
      const decodedToken = {
        currentRelationshipId: '81d48d6c-6e94-f011-b4cc-000d3ac28f39',
        relationships: [],
        enrolmentCount: 0,
        roles: []
      }

      const result = getOrganisationFromToken(decodedToken)

      expect(result).toEqual({
        hasMultipleOrgPickerEntries: false,
        userRelationshipType: 'Citizen'
      })
    })

    test('When relationship string format is incomplete', () => {
      const decodedToken = {
        currentRelationshipId: '81d48d6c-6e94-f011-b4cc-000d3ac28f39',
        relationships: ['81d48d6c-6e94-f011-b4cc-000d3ac28f39:27d48d6c'],
        enrolmentCount: 1,
        roles: ['role1']
      }

      const result = getOrganisationFromToken(decodedToken)

      expect(result).toEqual({
        organisationId: '27d48d6c',
        organisationName: undefined,
        userRelationshipType: 'Citizen',
        hasMultipleOrgPickerEntries: false,
        shouldShowOrgOrUserName: false
      })
    })

    test('When relationship role is an invalid value', () => {
      const decodedToken = {
        currentRelationshipId: '81d48d6c-6e94-f011-b4cc-000d3ac28f39',
        relationships: [
          '81d48d6c-6e94-f011-b4cc-000d3ac28f39:27d48d6c-6e94-f011-b4cc-000d3ac28f39:CDP Child Org 1:0:InvalidRole:0'
        ],
        enrolmentCount: 1,
        roles: ['role1']
      }

      const result = getOrganisationFromToken(decodedToken)

      expect(result).toEqual({
        organisationId: '27d48d6c-6e94-f011-b4cc-000d3ac28f39',
        organisationName: 'CDP Child Org 1',
        userRelationshipType: 'Citizen',
        hasMultipleOrgPickerEntries: false,
        shouldShowOrgOrUserName: false
      })
      expect(errorLogger).toHaveBeenCalledWith(
        'Invalid relationship type: InvalidRole'
      )
    })
  })
})
