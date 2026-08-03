import { buildApplicationDetailsCardData } from '#src/server/marine-licence/view-details/utils.js'
import { PROJECT_STATUS } from '#src/server/common/constants/projects.js'

describe('#buildApplicationDetailsCardData', () => {
  test('returns the application details fields and a rendered status tag', () => {
    const marineLicence = {
      applicationReference: 'ML-2026-001',
      status: PROJECT_STATUS.TRANSFERRED,
      submittedAt: '2026-01-15',
      transferredDate: '2026-02-20'
    }

    const result = buildApplicationDetailsCardData(marineLicence)

    expect(result.applicationReference).toBe('ML-2026-001')
    expect(result.isTransferred).toBe(true)
    expect(result.submittedAt).toBe('15 Jan 2026')
    expect(result.transferredDate).toBe('20 Feb 2026')
    expect(result.statusTag).toContain('govuk-tag--magenta')
    expect(result.statusTag).toContain(PROJECT_STATUS.TRANSFERRED)
  })

  test('sets isTransferred to false when status is not transferred', () => {
    const result = buildApplicationDetailsCardData({
      status: PROJECT_STATUS.SUBMITTED
    })

    expect(result.isTransferred).toBe(false)
  })

  test('escapes html in the status', () => {
    const marineLicence = { status: '<script>alert(1)</script>' }

    const result = buildApplicationDetailsCardData(marineLicence)

    expect(result.statusTag).not.toContain('<script>')
  })
})
