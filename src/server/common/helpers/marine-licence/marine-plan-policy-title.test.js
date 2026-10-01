import { formatPolicyTitle } from '#src/server/common/helpers/marine-licence/marine-plan-policy-title.js'

describe('formatPolicyTitle', () => {
  test('formats a plain-English title followed by the code', () => {
    expect(
      formatPolicyTitle({ policyCode: 'S-CAB-2', title: 'South Cables 2' })
    ).toBe('South Cables 2 (S-CAB-2)')
  })

  test('trims the title', () => {
    expect(
      formatPolicyTitle({ policyCode: 'S-CAB-2', title: ' South Cables 2 ' })
    ).toBe('South Cables 2 (S-CAB-2)')
  })

  test.each([
    ['missing', undefined],
    ['null', null],
    ['empty', ''],
    ['blank', '   '],
    ['the code repeated', 'SW-DD-3 ']
  ])('falls back to the code alone when the title is %s', (_, title) => {
    expect(formatPolicyTitle({ policyCode: 'SW-DD-3', title })).toBe('SW-DD-3')
  })
})
