import { sortByPolicyCode } from '#src/server/common/helpers/marine-licence/sort-by-policy-code.js'

describe('sortByPolicyCode', () => {
  test('sorts policies ascending by policy code', () => {
    const policies = [
      { policyCode: 'S-CC-2' },
      { policyCode: 'S-CC-1' },
      { policyCode: 'S-CC-10' }
    ]

    const result = sortByPolicyCode(policies)

    expect(result.map((policy) => policy.policyCode)).toEqual([
      'S-CC-1',
      'S-CC-10',
      'S-CC-2'
    ])
  })

  test('does not mutate the input array', () => {
    const policies = [{ policyCode: 'S-CC-2' }, { policyCode: 'S-CC-1' }]

    sortByPolicyCode(policies)

    expect(policies.map((policy) => policy.policyCode)).toEqual([
      'S-CC-2',
      'S-CC-1'
    ])
  })
})
