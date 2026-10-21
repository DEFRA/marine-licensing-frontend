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
        userRoleType: null,
        hasMultipleOrgPickerEntries: false,
        shouldShowOrgOrUserName: true,
        shouldShowCitizenName: false
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
        userRoleType: null,
        hasMultipleOrgPickerEntries: true,
        shouldShowOrgOrUserName: true,
        shouldShowCitizenName: false
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
        userRoleType: null,
        hasMultipleOrgPickerEntries: true,
        shouldShowOrgOrUserName: true,
        shouldShowCitizenName: false
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
        userRoleType: null,
        hasMultipleOrgPickerEntries: false,
        shouldShowOrgOrUserName: false,
        shouldShowCitizenName: false
      })
    })

    test('When token has a Consultee role for the current relationship', () => {
      const result = getOrganisationFromToken({
        currentRelationshipId: '23950a2d-c37d-43da-9fcb-0a4ce9aa11ee',
        relationships: [
          '23950a2d-c37d-43da-9fcb-0a4ce9aa11ee:bc19305a-f9b6-ea11-a812-000d3ab4653d:ABC Organisation2:0:Employee:0',
          'e0dfefcf-f0f0-4383-b094-1da327083589:a1837c90-c8f2-4ac3-90b2-83df6145e3c5:XYZ Organisation:0:Agent:0'
        ],
        enrolmentCount: 2,
        roles: [
          '23950a2d-c37d-43da-9fcb-0a4ce9aa11ee:Consultee:3',
          'e0dfefcf-f0f0-4383-b094-1da327083589:Reviewer:3'
        ]
      })

      expect(result).toEqual({
        organisationId: 'bc19305a-f9b6-ea11-a812-000d3ab4653d',
        organisationName: 'ABC Organisation2',
        userRelationshipType: 'Employee',
        userRoleType: 'Consultee',
        hasMultipleOrgPickerEntries: true,
        shouldShowOrgOrUserName: true,
        shouldShowCitizenName: false
      })
    })

    test('When a single-org Agent is a Consultee the organisation name is shown', () => {
      const result = getOrganisationFromToken({
        currentRelationshipId: 'e0dfefcf-f0f0-4383-b094-1da327083589',
        relationships: [
          'e0dfefcf-f0f0-4383-b094-1da327083589:a1837c90-c8f2-4ac3-90b2-83df6145e3c5:XYZ Organisation:0:Agent:0'
        ],
        enrolmentCount: 1,
        roles: ['e0dfefcf-f0f0-4383-b094-1da327083589:Consultee:3']
      })

      expect(result.userRoleType).toBe('Consultee')
      expect(result.shouldShowOrgOrUserName).toBe(true)
      expect(result.shouldShowCitizenName).toBe(false)
    })

    test('When the role for the current relationship is not Consultee', () => {
      const result = getOrganisationFromToken({
        currentRelationshipId: 'e0dfefcf-f0f0-4383-b094-1da327083589',
        relationships: [
          'e0dfefcf-f0f0-4383-b094-1da327083589:a1837c90-c8f2-4ac3-90b2-83df6145e3c5:XYZ Organisation:0:Agent:0'
        ],
        enrolmentCount: 2,
        roles: [
          '23950a2d-c37d-43da-9fcb-0a4ce9aa11ee:Consultee:3',
          'e0dfefcf-f0f0-4383-b094-1da327083589:Reviewer:3'
        ]
      })

      expect(result.userRelationshipType).toBe('Agent')
      expect(result.userRoleType).toBe('Reviewer')
    })

    test.each(['1', '2', '4', '5', '6', '7'])(
      'When the Consultee role has status %s it is not approved',
      (status) => {
        const result = getOrganisationFromToken({
          currentRelationshipId: 'f0239b00-0411-4dca-b5d7-a428f3e86982',
          relationships: [
            'f0239b00-0411-4dca-b5d7-a428f3e86982:f0239b00-0411-4dca-b5d7-a428f3e86982:Some Org:0:Employee:0'
          ],
          enrolmentCount: 1,
          roles: [`f0239b00-0411-4dca-b5d7-a428f3e86982:Consultee:${status}`]
        })

        expect(result.userRoleType).toBeNull()
      }
    )

    test('When no role matches the current relationship', () => {
      const result = getOrganisationFromToken({
        currentRelationshipId: '81d48d6c-6e94-f011-b4cc-000d3ac28f39',
        relationships: [
          '81d48d6c-6e94-f011-b4cc-000d3ac28f39:27d48d6c-6e94-f011-b4cc-000d3ac28f39:CDP Child Org 1:0:Employee:0'
        ],
        enrolmentCount: 1,
        roles: ['role1']
      })

      expect(result.userRoleType).toBeNull()
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
        userRoleType: null,
        hasMultipleOrgPickerEntries: true,
        shouldShowOrgOrUserName: true,
        shouldShowCitizenName: false
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
        userRoleType: null,
        hasMultipleOrgPickerEntries: false,
        shouldShowOrgOrUserName: false,
        shouldShowCitizenName: true
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
        shouldShowCitizenName: true,
        userRelationshipType: 'Citizen',
        userRoleType: null
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
        shouldShowCitizenName: true,
        userRelationshipType: 'Citizen',
        userRoleType: null
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
        shouldShowCitizenName: true,
        userRelationshipType: 'Citizen',
        userRoleType: null
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
        shouldShowCitizenName: true,
        userRelationshipType: 'Citizen',
        userRoleType: null
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
        userRoleType: null,
        hasMultipleOrgPickerEntries: false,
        shouldShowOrgOrUserName: false,
        shouldShowCitizenName: true
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
        shouldShowCitizenName: true,
        userRelationshipType: 'Citizen',
        userRoleType: null
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
        userRoleType: null,
        hasMultipleOrgPickerEntries: false,
        shouldShowOrgOrUserName: false,
        shouldShowCitizenName: true
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
        userRoleType: null,
        hasMultipleOrgPickerEntries: false,
        shouldShowOrgOrUserName: false,
        shouldShowCitizenName: true
      })
      expect(errorLogger).toHaveBeenCalledWith(
        'Invalid relationship type: InvalidRole'
      )
    })
  })
})
