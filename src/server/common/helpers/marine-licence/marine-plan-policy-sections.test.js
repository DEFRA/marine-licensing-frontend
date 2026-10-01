import {
  getPolicySection,
  getPolicySectionSlug,
  groupPoliciesBySection,
  UNCATEGORISED_SECTION
} from '#src/server/common/helpers/marine-licence/marine-plan-policy-sections.js'

describe('marine plan policy sections', () => {
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
    expect(getPolicySectionSlug('Social (heritage)')).toBe('social-heritage')
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
        result.map(({ heading, slug, policies }) => ({
          heading,
          slug,
          codes: policies.map((policy) => policy.policyCode)
        }))
      ).toEqual([
        {
          heading: 'Cross-cutting',
          slug: 'cross-cutting',
          codes: ['S-CC-1', 'S-CC-2']
        },
        { heading: 'Economic', slug: 'economic', codes: ['S-CAB-1'] },
        {
          heading: 'Environmental',
          slug: 'environmental',
          codes: ['S-BIO-1']
        },
        { heading: 'Social', slug: 'social', codes: ['S-TR-1'] },
        { heading: 'Other', slug: 'other', codes: ['S-AGG-1'] }
      ])
    })

    test('omits sections that have no policies', () => {
      const result = groupPoliciesBySection([
        { policyCode: 'S-CAB-1', category: 'Economic' }
      ])

      expect(result.map(({ heading }) => heading)).toEqual(['Economic'])
    })
  })
})
