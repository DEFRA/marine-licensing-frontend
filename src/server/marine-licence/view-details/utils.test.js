import { buildApplicationDetailsCardData } from '#src/server/marine-licence/view-details/utils.js'
import {
  PROJECT_STATUS,
  UNABLE_TO_PROGRESS
} from '#src/server/common/constants/projects.js'
import { expect } from 'vitest'

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

  test('returns the application details fields and a rendered rejected status tag', () => {
    const marineLicence = {
      applicationReference: 'ML-2026-001',
      status: PROJECT_STATUS.REJECTED,
      submittedAt: '2026-01-15',
      rejectedDate: '2026-03-20',
      rejectedReasons: 'Reason 1,Reason 2',
      rejectedInformation: 'Test text'
    }

    const result = buildApplicationDetailsCardData(marineLicence)

    expect(result.applicationReference).toBe('ML-2026-001')
    expect(result.isRejected).toBe(true)
    expect(result.submittedAt).toBe('15 Jan 2026')
    expect(result.rejectedDate).toBe('20 Mar 2026')
    expect(result.rejectedReasons).toEqual(['Reason 1', 'Reason 2'])
    expect(result.statusTag).toContain('govuk-tag--orange')
    expect(result.statusTag).toContain(UNABLE_TO_PROGRESS)
  })

  test('leaves rejectedReasons unset when not present', () => {
    const result = buildApplicationDetailsCardData({
      status: PROJECT_STATUS.SUBMITTED
    })

    expect(result.rejectedReasons).toBeUndefined()
  })

  test('sets isTransferred to false when status is not transferred', () => {
    const result = buildApplicationDetailsCardData({
      status: PROJECT_STATUS.SUBMITTED
    })

    expect(result.isTransferred).toBe(false)
  })

  test('returns the withdrawal fields when the application is withdrawn', () => {
    const result = buildApplicationDetailsCardData({
      applicationReference: 'MLA/2025/10018',
      status: PROJECT_STATUS.WITHDRAWN,
      submittedAt: '2025-12-15',
      withdrawnAt: '2026-01-19'
    })

    expect(result.isWithdrawn).toBe(true)
    expect(result.isTransferred).toBe(false)
    expect(result.submittedAt).toBe('15 Dec 2025')
    expect(result.withdrawnAt).toBe('19 Jan 2026')
    expect(result.transferredDate).toBe('')
    expect(result.statusTag).toContain('govuk-tag--grey')
    expect(result.statusTag).toContain(PROJECT_STATUS.WITHDRAWN)
  })

  test('sets isWithdrawn to false when status is not withdrawn', () => {
    const result = buildApplicationDetailsCardData({
      status: PROJECT_STATUS.SUBMITTED
    })

    expect(result.isWithdrawn).toBe(false)
    expect(result.withdrawnAt).toBe('')
  })

  test('escapes html in the status', () => {
    const marineLicence = { status: '<script>alert(1)</script>' }

    const result = buildApplicationDetailsCardData(marineLicence)

    expect(result.statusTag).not.toContain('<script>')
  })
})
