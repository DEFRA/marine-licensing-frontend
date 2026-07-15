import { buildMarinePlanPoliciesData } from '#src/server/common/helpers/marine-licence/marine-plan-policies-data.js'
import { getMarinePlanPolicyLink } from '#src/server/common/helpers/marine-licence/marine-plan-policy-link.js'

describe('buildMarinePlanPoliciesData', () => {
  test('returns an empty array when there are no policies', () => {
    expect(buildMarinePlanPoliciesData({})).toEqual([])
    expect(buildMarinePlanPoliciesData(undefined)).toEqual([])
  })

  test('maps and sorts policies alphabetically by policy code', () => {
    const result = buildMarinePlanPoliciesData({
      marinePlanPolicies: [
        { policyCode: 'S-CC-2', policy: 'Second wording' },
        { policyCode: 'S-CC-1', policy: 'First wording' }
      ],
      marinePlanPolicyResponses: { 'S-CC-1': 'My consideration' }
    })

    expect(result).toEqual([
      {
        policyCode: 'S-CC-1',
        wording: 'First wording',
        response: 'My consideration',
        changeHref: getMarinePlanPolicyLink('S-CC-1')
      },
      {
        policyCode: 'S-CC-2',
        wording: 'Second wording',
        response: '',
        changeHref: getMarinePlanPolicyLink('S-CC-2')
      }
    ])
  })

  test('defaults missing wording and response to empty strings', () => {
    const result = buildMarinePlanPoliciesData({
      marinePlanPolicies: [{ policyCode: 'S-CC-1' }]
    })

    expect(result[0]).toMatchObject({ wording: '', response: '' })
  })
})
