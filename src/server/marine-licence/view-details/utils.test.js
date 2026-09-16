import {
  buildApplicationDetailsCardData,
  buildRedactionsForView
} from '#src/server/marine-licence/view-details/utils.js'
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
    expect(result.submittedAt).toBe('15 January 2026')
    expect(result.transferredDate).toBe('20 February 2026')
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
    expect(result.submittedAt).toBe('15 January 2026')
    expect(result.rejectedDate).toBe('20 March 2026')
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
    expect(result.submittedAt).toBe('15 December 2025')
    expect(result.withdrawnAt).toBe('19 January 2026')
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

describe('#buildRedactionsForView', () => {
  const labelHtml = '<span class="app-redaction-label">***REDACTED***</span>'

  const build = (redactedText) =>
    buildRedactionsForView({
      preferredDates: { redactedText, redactedBy: 'Test User' }
    }).preferredDates

  test('wraps every redaction label in a span', () => {
    expect(build('From ***REDACTED*** until ***REDACTED***').redactedText).toBe(
      `From ${labelHtml} until ${labelHtml}`
    )
  })

  test('keeps the raw text for the edit form', () => {
    expect(build('From ***REDACTED***').redactedTextValue).toBe(
      'From ***REDACTED***'
    )
  })

  test('leaves text without a label untouched', () => {
    expect(build('July 2026 to August 2027').redactedText).toBe(
      'July 2026 to August 2027'
    )
  })

  test('escapes html in the surrounding text', () => {
    const result = build('<script>alert(1)</script> ***REDACTED***')

    expect(result.redactedText).not.toContain('<script>')
    expect(result.redactedText).toContain(labelHtml)
  })

  test('preserves the other redaction fields', () => {
    expect(build('***REDACTED***').redactedBy).toBe('Test User')
  })

  test.each([[null], [undefined], [{}]])(
    'returns an empty object for %s',
    (redactions) => {
      expect(buildRedactionsForView(redactions)).toEqual({})
    }
  )
})
