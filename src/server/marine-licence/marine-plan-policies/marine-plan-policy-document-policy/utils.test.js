import {
  getPolicyLinks,
  getPolicyLinksPayload,
  getPolicyOptions
} from '#src/server/marine-licence/marine-plan-policies/marine-plan-policy-document-policy/utils.js'
import { mockMarinePlanPolicies } from '#src/server/test-helpers/mocks/marine-licence-mocks.js'

describe('#getPolicyOptions', () => {
  test('maps each code to its policy, in requiringDocuments order', () => {
    expect(
      getPolicyOptions(['S-CC-1', 'S-CC-2'], mockMarinePlanPolicies)
    ).toEqual([
      { value: 'S-CC-1', text: 'South Climate change 1 (S-CC-1)' },
      { value: 'S-CC-2', text: 'South Climate change 2 (S-CC-2)' }
    ])
  })

  test('only includes policies from requiringDocuments', () => {
    expect(getPolicyOptions(['S-CC-2'], mockMarinePlanPolicies)).toEqual([
      { value: 'S-CC-2', text: 'South Climate change 2 (S-CC-2)' }
    ])
  })

  test('returns no options when no policies require documents', () => {
    expect(getPolicyOptions([], mockMarinePlanPolicies)).toEqual([])
  })
})

describe('#getPolicyLinksPayload', () => {
  test('turns saved links into form fields', () => {
    expect(
      getPolicyLinksPayload([
        { policyCode: 'S-CC-1', location: 'section 4.2' },
        { policyCode: 'S-CC-2', location: 'pages 12 to 15' }
      ])
    ).toEqual({
      supportedPolicies: ['S-CC-1', 'S-CC-2'],
      'location-S-CC-1': 'section 4.2',
      'location-S-CC-2': 'pages 12 to 15'
    })
  })

  test('returns an empty selection when there are no saved links', () => {
    expect(getPolicyLinksPayload()).toEqual({ supportedPolicies: [] })
  })
})

describe('#getPolicyLinks', () => {
  test('pairs each selected policy with its location, ignoring unselected ones', () => {
    expect(
      getPolicyLinks({
        supportedPolicies: ['S-CC-1', 'S-CC-3'],
        'location-S-CC-1': 'section 4.2',
        'location-S-CC-2': '',
        'location-S-CC-3': 'pages 12 to 15'
      })
    ).toEqual([
      { policyCode: 'S-CC-1', location: 'section 4.2' },
      { policyCode: 'S-CC-3', location: 'pages 12 to 15' }
    ])
  })
})
