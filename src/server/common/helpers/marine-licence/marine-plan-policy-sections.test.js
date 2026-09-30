import {
  formatPolicyTitle,
  getPolicySection,
  getPolicySectionSlug,
  getPolicyTitle,
  groupPoliciesBySection,
  UNCATEGORISED_SECTION
} from '#src/server/common/helpers/marine-licence/marine-plan-policy-sections.js'

describe('marine plan policy sections', () => {
  describe('getPolicyTitle / formatPolicyTitle', () => {
    test('formats a plain-English title followed by the code', () => {
      const policy = { policyCode: 'S-CAB-2', title: 'South Cables 2' }

      expect(getPolicyTitle(policy)).toBe('South Cables 2')
      expect(formatPolicyTitle(policy)).toBe('South Cables 2 (S-CAB-2)')
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
      const policy = { policyCode: 'SW-DD-3', title }

      expect(getPolicyTitle(policy)).toBeNull()
      expect(formatPolicyTitle(policy)).toBe('SW-DD-3')
    })
  })

  describe('getPolicySection', () => {
    test('uses the trimmed category', () => {
      expect(getPolicySection({ category: ' Economic ' })).toBe('Economic')
    })

    test.each([undefined, null, '', '  '])(
      'puts a policy with category %s under the uncategorised section',
      (category) => {
        expect(getPolicySection({ category })).toBe(UNCATEGORISED_SECTION)
      }
    )
  })

  test('getPolicySectionSlug makes a section name safe for an id', () => {
    expect(getPolicySectionSlug('Cross-cutting')).toBe('cross-cutting')
    expect(getPolicySectionSlug('Economic')).toBe('economic')
    expect(getPolicySectionSlug('Coastal & Marine')).toBe('coastal-marine')
  })

  describe('groupPoliciesBySection', () => {
    test('returns no sections when there are no policies', () => {
      expect(groupPoliciesBySection([])).toEqual([])
    })

    test('sorts sections alphabetically with uncategorised last, and policies by code within each', () => {
      const result = groupPoliciesBySection([
        { policyCode: 'S-TR-1', category: 'Social' },
        { policyCode: 'S-CC-2', category: 'Cross-cutting' },
        { policyCode: 'S-AGG-1' },
        { policyCode: 'S-CC-1', category: 'Cross-cutting' },
        { policyCode: 'S-BIO-1', category: 'Environmental' },
        { policyCode: 'S-CAB-1', category: 'Economic' }
      ])

      expect(
        result.map(({ section, slug, policies }) => ({
          section,
          slug,
          codes: policies.map((policy) => policy.policyCode)
        }))
      ).toEqual([
        {
          section: 'Cross-cutting',
          slug: 'cross-cutting',
          codes: ['S-CC-1', 'S-CC-2']
        },
        { section: 'Economic', slug: 'economic', codes: ['S-CAB-1'] },
        {
          section: 'Environmental',
          slug: 'environmental',
          codes: ['S-BIO-1']
        },
        { section: 'Social', slug: 'social', codes: ['S-TR-1'] },
        { section: 'Other', slug: 'other', codes: ['S-AGG-1'] }
      ])
    })

    test('omits sections that have no policies', () => {
      const result = groupPoliciesBySection([
        { policyCode: 'S-CAB-1', category: 'Economic' }
      ])

      expect(result.map(({ section }) => section)).toEqual(['Economic'])
    })
  })
})
