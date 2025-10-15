import { getApplicantOrganisationFromToken } from '#src/server/common/plugins/auth/get-applicant-organisation.js'

describe('#getApplicantOrganisationFromToken', () => {
  test('When token has valid relationship data', () => {
    const decodedToken = {
      currentRelationshipId: '81d48d6c-6e94-f011-b4cc-000d3ac28f39',
      relationships: [
        '81d48d6c-6e94-f011-b4cc-000d3ac28f39:27d48d6c-6e94-f011-b4cc-000d3ac28f39:CDP Child Org 1:0:Employee:0'
      ],
      enrolmentCount: 1,
      roles: ['role1']
    }

    const result = getApplicantOrganisationFromToken(decodedToken)

    expect(result).toEqual({
      applicantOrganisationId: '27d48d6c-6e94-f011-b4cc-000d3ac28f39',
      applicantOrganisationName: 'CDP Child Org 1',
      hasMultipleOrganisations: false
    })
  })

  test('When user has multiple organisations (enrolmentCount > roles.length)', () => {
    const decodedToken = {
      currentRelationshipId: '81d48d6c-6e94-f011-b4cc-000d3ac28f39',
      relationships: [
        '81d48d6c-6e94-f011-b4cc-000d3ac28f39:27d48d6c-6e94-f011-b4cc-000d3ac28f39:CDP Child Org 1:0:Employee:0'
      ],
      enrolmentCount: 3,
      roles: ['role1']
    }

    const result = getApplicantOrganisationFromToken(decodedToken)

    expect(result).toEqual({
      applicantOrganisationId: '27d48d6c-6e94-f011-b4cc-000d3ac28f39',
      applicantOrganisationName: 'CDP Child Org 1',
      hasMultipleOrganisations: true
    })
  })

  test('When user has multiple organisations (relationships.length > 1)', () => {
    const decodedToken = {
      currentRelationshipId: '81d48d6c-6e94-f011-b4cc-000d3ac28f39',
      relationships: [
        '81d48d6c-6e94-f011-b4cc-000d3ac28f39:27d48d6c-6e94-f011-b4cc-000d3ac28f39:CDP Child Org 1:0:Employee:0',
        '91d48d6c-6e94-f011-b4cc-000d3ac28f39:37d48d6c-6e94-f011-b4cc-000d3ac28f39:CDP Child Org 2:0:Employee:0'
      ],
      enrolmentCount: 2,
      roles: ['role1', 'role2']
    }

    const result = getApplicantOrganisationFromToken(decodedToken)

    expect(result).toEqual({
      applicantOrganisationId: '27d48d6c-6e94-f011-b4cc-000d3ac28f39',
      applicantOrganisationName: 'CDP Child Org 1',
      hasMultipleOrganisations: true
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

    const result = getApplicantOrganisationFromToken(decodedToken)

    expect(result).toEqual({
      applicantOrganisationId: null,
      applicantOrganisationName: null,
      hasMultipleOrganisations: false
    })
  })

  test('When relationships array is empty', () => {
    const decodedToken = {
      currentRelationshipId: '81d48d6c-6e94-f011-b4cc-000d3ac28f39',
      relationships: [],
      enrolmentCount: 0,
      roles: []
    }

    const result = getApplicantOrganisationFromToken(decodedToken)

    expect(result).toEqual({
      applicantOrganisationId: null,
      applicantOrganisationName: null,
      hasMultipleOrganisations: false
    })
  })

  test('When relationship string format is incomplete', () => {
    const decodedToken = {
      currentRelationshipId: '81d48d6c-6e94-f011-b4cc-000d3ac28f39',
      relationships: ['81d48d6c-6e94-f011-b4cc-000d3ac28f39:27d48d6c'],
      enrolmentCount: 1,
      roles: ['role1']
    }

    const result = getApplicantOrganisationFromToken(decodedToken)

    expect(result).toEqual({
      applicantOrganisationId: '27d48d6c',
      applicantOrganisationName: null,
      hasMultipleOrganisations: false
    })
  })
})
