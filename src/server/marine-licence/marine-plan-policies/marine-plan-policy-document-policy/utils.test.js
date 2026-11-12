import { getPolicyOptions } from '#src/server/marine-licence/marine-plan-policies/marine-plan-policy-document-policy/utils.js'
import { mockMarinePlanPolicies } from '#src/server/test-helpers/mocks/marine-licence-mocks.js'

describe('#getPolicyOptions', () => {
  test('maps each outstanding code to its policy, in documentsOutstanding order', () => {
    expect(
      getPolicyOptions(['S-CC-1', 'S-CC-2'], mockMarinePlanPolicies)
    ).toEqual([
      { value: 'S-CC-1', text: 'South Climate change 1 (S-CC-1)' },
      { value: 'S-CC-2', text: 'South Climate change 2 (S-CC-2)' }
    ])
  })

  test('only includes outstanding policies from documentsOutstanding', () => {
    expect(getPolicyOptions(['S-CC-2'], mockMarinePlanPolicies)).toEqual([
      { value: 'S-CC-2', text: 'South Climate change 2 (S-CC-2)' }
    ])
  })

  test('returns no options when nothing is outstanding', () => {
    expect(getPolicyOptions([], mockMarinePlanPolicies)).toEqual([])
  })
})
