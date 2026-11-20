import { getCheckAnswersSummary } from '#src/server/marine-licence/public-register/check-answers/utils.js'
import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'

describe('getCheckAnswersSummary', () => {
  const request = { query: {} }

  test('national security without approval ignores a stray reason', () => {
    expect(
      getCheckAnswersSummary(request, {
        withholdConsent: 'yes',
        withholdReason: 'nationalSecurity',
        nationalSecurityApproval: 'no',
        reason: 'Stale details'
      }).reason
    ).toBeNull()
  })

  test('national security reason has no Change link of its own', () => {
    const summary = getCheckAnswersSummary(request, {
      withholdConsent: 'yes',
      withholdReason: 'nationalSecurity',
      nationalSecurityApproval: 'yes',
      reason: 'Details'
    })

    expect(summary.reason.actions).toBeNull()
    expect(summary.approval.actions.items[0].href).toBe(
      `${marineLicenceRoutes.MARINE_LICENCE_PUBLIC_REGISTER_NATIONAL_SECURITY}?action=change`
    )
  })

  test('commercial reason links to the commercial confidentiality page', () => {
    const summary = getCheckAnswersSummary(request, {
      withholdConsent: 'yes',
      withholdReason: 'commercialConfidentiality',
      reason: 'Pricing'
    })

    expect(summary.approval).toBeNull()
    expect(summary.reason.actions.items).toEqual([
      {
        href: `${marineLicenceRoutes.MARINE_LICENCE_PUBLIC_REGISTER_COMMERCIAL_CONFIDENTIALITY}?action=change`,
        text: 'Change',
        visuallyHiddenText: 'what you want withheld and why'
      }
    ])
  })
})
