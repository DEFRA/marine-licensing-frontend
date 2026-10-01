import { buildMarinePlanPoliciesData } from '#src/server/common/helpers/marine-licence/marine-plan-policies-data.js'
import { getMarinePlanPolicyLink } from '#src/server/common/helpers/marine-licence/marine-plan-policy-link.js'

describe('buildMarinePlanPoliciesData', () => {
  test('returns an empty array when there are no policies', () => {
    expect(buildMarinePlanPoliciesData({})).toEqual([])
    expect(buildMarinePlanPoliciesData(undefined)).toEqual([])
  })

  test('groups policies into sections and sorts them by policy code', () => {
    const result = buildMarinePlanPoliciesData({
      marinePlanPolicies: [
        {
          policyCode: 'S-CC-2',
          title: 'South Climate change 2',
          category: 'Cross-cutting',
          policy: 'Second wording'
        },
        {
          policyCode: 'S-CAB-1',
          title: 'South Cables 1',
          category: 'Economic',
          policy: 'Cables wording'
        },
        {
          policyCode: 'S-CC-1',
          title: 'South Climate change 1',
          category: 'Cross-cutting',
          policy: 'First wording'
        }
      ],
      marinePlanPolicyResponses: { 'S-CC-1': 'My consideration' }
    })

    expect(result).toEqual([
      {
        heading: 'Cross-cutting',
        slug: 'cross-cutting',
        policies: [
          {
            policyCode: 'S-CC-1',
            displayTitle: 'South Climate change 1 (S-CC-1)',
            wording: 'First wording',
            response: 'My consideration',
            changeHref: getMarinePlanPolicyLink('S-CC-1')
          },
          {
            policyCode: 'S-CC-2',
            displayTitle: 'South Climate change 2 (S-CC-2)',
            wording: 'Second wording',
            response: '',
            changeHref: getMarinePlanPolicyLink('S-CC-2')
          }
        ]
      },
      {
        heading: 'Economic',
        slug: 'economic',
        policies: [
          {
            policyCode: 'S-CAB-1',
            displayTitle: 'South Cables 1 (S-CAB-1)',
            wording: 'Cables wording',
            response: '',
            changeHref: getMarinePlanPolicyLink('S-CAB-1')
          }
        ]
      }
    ])
  })

  test('falls back to the code for the title and defaults missing wording and response', () => {
    const [section] = buildMarinePlanPoliciesData({
      marinePlanPolicies: [{ policyCode: 'S-CC-1' }]
    })

    expect(section.heading).toBe('Other')
    expect(section.policies[0]).toMatchObject({
      displayTitle: 'S-CC-1',
      wording: '',
      response: ''
    })
  })
})
