import { describe, expect, test } from 'vitest'
import {
  formatEntriesForDisplay,
  parseApplicationReference,
  sortByReferenceNewestFirst
} from './utils.js'
import { EXEMPTION_TYPE } from '#src/server/common/constants/exemptions.js'
import { PROJECT_TYPE } from '#src/server/common/constants/projects.js'

describe('public register utils', () => {
  describe('#parseApplicationReference', () => {
    test('parses a valid reference number', () => {
      expect(parseApplicationReference('EXE/2026/00012')).toEqual({
        year: 2026,
        sequence: 12
      })
    })

    test('returns zero values for invalid references', () => {
      expect(parseApplicationReference('invalid')).toEqual({
        year: 0,
        sequence: 0
      })
    })
  })

  describe('#sortByReferenceNewestFirst', () => {
    test('sorts by year then sequence descending', () => {
      const entries = [
        { applicationReference: 'EXE/2025/00099' },
        { applicationReference: 'EXE/2026/00003' },
        { applicationReference: 'EXE/2026/00012' }
      ]

      expect(sortByReferenceNewestFirst(entries)).toEqual([
        { applicationReference: 'EXE/2026/00012' },
        { applicationReference: 'EXE/2026/00003' },
        { applicationReference: 'EXE/2025/00099' }
      ])
    })
  })

  describe('#formatEntriesForDisplay', () => {
    test('formats rows for the public register table', () => {
      const [row] = formatEntriesForDisplay([
        {
          applicationId: 'abc123',
          applicationType: PROJECT_TYPE.EXEMPTION,
          applicationReference: 'EXE/2026/00012',
          projectName: 'South coast sea samples',
          marinePlanAreas: ['South', 'South West'],
          dateSubmitted: '2026-03-18',
          status: 'Active'
        }
      ])

      expect(row[0]).toEqual({ text: 'EXE/2026/00012' })
      expect(row[1]).toEqual({ text: 'South coast sea samples' })
      expect(row[2]).toEqual({ text: EXEMPTION_TYPE })
      expect(row[3]).toEqual({ text: 'South, South West' })
      expect(row[4]).toEqual({ text: '18 Mar 2026' })
      expect(row[5].html).toContain('govuk-tag--green')
      expect(row[5].html).toContain('Active')
      expect(row[6].html).toContain('/exemption/view-public-details/abc123')
      expect(row[6].html).toContain('View details')
      expect(row[6].html).toContain('South coast sea samples')
    })

    test('uses withdrawn tag styling', () => {
      const [row] = formatEntriesForDisplay([
        {
          applicationId: 'abc123',
          applicationType: PROJECT_TYPE.EXEMPTION,
          applicationReference: 'EXE/2026/00001',
          projectName: 'Withdrawn project',
          status: 'Withdrawn'
        }
      ])

      expect(row[5].html).toContain('govuk-tag--grey')
      expect(row[5].html).toContain('Withdrawn')
    })

    test('uses marinePlanArea when present', () => {
      const [row] = formatEntriesForDisplay([
        {
          applicationId: 'abc123',
          applicationType: PROJECT_TYPE.EXEMPTION,
          applicationReference: 'EXE/2026/00001',
          projectName: 'Single area project',
          marinePlanArea: 'North',
          dateSubmitted: '2026-01-02',
          status: 'Active'
        }
      ])

      expect(row[3]).toEqual({ text: 'North' })
    })

    test('falls back to defaults when optional fields are missing', () => {
      const [row] = formatEntriesForDisplay([
        {
          applicationId: 'abc123',
          applicationType: PROJECT_TYPE.EXEMPTION,
          marinePlanAreas: []
        }
      ])

      expect(row[0]).toEqual({ text: '-' })
      expect(row[1]).toEqual({ text: '-' })
      expect(row[3]).toEqual({ text: '-' })
      expect(row[4]).toEqual({ text: '-' })
      expect(row[5].html).toContain('Active')
    })
  })
})
