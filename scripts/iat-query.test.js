import { describe, it, expect } from 'vitest'
import { runCommand } from './iat-query.js'

describe('iat-query', () => {
  describe('question', () => {
    it('returns a known question by route', () => {
      const { stdout, code } = runCommand(['question', '/activity-type'])
      expect(code).toBe(0)
      expect(stdout).toMatch(/ACTIVITY_TYPE/)
      expect(stdout).toMatch(/CON/)
    })

    it('exits 1 on unknown route', () => {
      const { stdout, code } = runCommand(['question', '/no-such-route'])
      expect(code).toBe(1)
      expect(stdout).toMatch(/not found/)
    })

    it('--json emits valid parseable JSON with question fields', () => {
      const { stdout, code } = runCommand(['question', '/activity-type', '--json'])
      expect(code).toBe(0)
      const parsed = JSON.parse(stdout)
      expect(parsed.mcmsAppFormMapping).toBe('ACTIVITY_TYPE')
      expect(Array.isArray(parsed.answers)).toBe(true)
      expect(parsed.answers[0]).toHaveProperty('target')
    })
  })

  describe('outcome', () => {
    it('returns a known outcome by route', () => {
      const { stdout, code } = runCommand(['outcome', '/mod-permission'])
      expect(code).toBe(0)
      expect(stdout).toMatch(/MOD/)
      expect(stdout).toMatch(/classification/)
    })

    it('exits 1 on unknown route', () => {
      const { stdout, code } = runCommand(['outcome', '/no-such-outcome'])
      expect(code).toBe(1)
      expect(stdout).toMatch(/not found/)
    })

    it('--json includes classification and outcomeTypes', () => {
      const { stdout, code } = runCommand(['outcome', '/mod-permission', '--json'])
      expect(code).toBe(0)
      const parsed = JSON.parse(stdout)
      expect(parsed).toHaveProperty('classification')
      expect(Array.isArray(parsed.outcomeTypes)).toBe(true)
    })
  })

  describe('outcome-type', () => {
    it('returns a known outcomeType by id', () => {
      const { stdout, code } = runCommand(['outcome-type', 'WO_FAST_TRACK_MLA'])
      expect(code).toBe(0)
      expect(stdout).toMatch(/WO_FAST_TRACK_MLA/)
      expect(stdout).toMatch(/FAST_TRACK/)
    })

    it('exits 1 on unknown id', () => {
      const { stdout, code } = runCommand(['outcome-type', 'NO_SUCH_ID'])
      expect(code).toBe(1)
      expect(stdout).toMatch(/not found/)
    })

    it('--json includes params and all fields', () => {
      const { stdout, code } = runCommand(['outcome-type', 'WO_FAST_TRACK_MLA', '--json'])
      expect(code).toBe(0)
      const parsed = JSON.parse(stdout)
      expect(parsed.id).toBe('WO_FAST_TRACK_MLA')
      expect(Array.isArray(parsed.params)).toBe(true)
      expect(parsed.params[0].name).toBe('FAST_TRACK')
    })
  })

  describe('outcomes', () => {
    it('lists all outcomes', () => {
      const { stdout, code } = runCommand(['outcomes'])
      expect(code).toBe(0)
      const lines = stdout.split('\n').filter(Boolean)
      expect(lines.length).toBeGreaterThan(0)
      expect(lines[0]).toMatch(/\t/)
    })

    it('--classify filters to only the requested classification', () => {
      const { stdout, code } = runCommand(['outcomes', '--classify', 'terminal-single'])
      expect(code).toBe(0)
      const lines = stdout.split('\n').filter(Boolean)
      expect(lines.length).toBeGreaterThan(0)
      for (const line of lines) {
        expect(line).toContain('terminal-single')
      }
    })

    it('--has-param filters outcomes whose types have the param', () => {
      const { stdout, code } = runCommand(['outcomes', '--has-param', 'FAST_TRACK'])
      expect(code).toBe(0)
      const lines = stdout.split('\n').filter(Boolean)
      expect(lines.length).toBeGreaterThan(0)
    })

    it('--json emits an array with route and classification', () => {
      const { stdout, code } = runCommand(['outcomes', '--classify', 'intermediate', '--json'])
      expect(code).toBe(0)
      const parsed = JSON.parse(stdout)
      expect(Array.isArray(parsed)).toBe(true)
      expect(parsed[0]).toHaveProperty('route')
      expect(parsed[0]).toHaveProperty('classification')
      expect(parsed[0].classification).toBe('intermediate')
    })
  })

  describe('outcome-types', () => {
    it('lists all outcomeTypes', () => {
      const { stdout, code } = runCommand(['outcome-types'])
      expect(code).toBe(0)
      const lines = stdout.split('\n').filter(Boolean)
      expect(lines.length).toBeGreaterThan(0)
    })

    it('--has-next-question filters to types with nextQuestionRoute', () => {
      const { stdout, code } = runCommand(['outcome-types', '--has-next-question'])
      expect(code).toBe(0)
      const lines = stdout.split('\n').filter(Boolean)
      expect(lines.length).toBeGreaterThan(0)
      for (const line of lines) {
        const parts = line.split('\t')
        expect(parts[2]).not.toBe('-')
      }
    })

    it('--has-param NAME=VALUE matches exact value', () => {
      const { stdout, code } = runCommand(['outcome-types', '--has-param', 'FAST_TRACK=true'])
      expect(code).toBe(0)
      const lines = stdout.split('\n').filter(Boolean)
      expect(lines.length).toBeGreaterThan(0)
      expect(lines[0]).toContain('FAST_TRACK=true')
    })

    it('--json emits an array of outcomeType objects', () => {
      const { stdout, code } = runCommand(['outcome-types', '--has-param', 'FAST_TRACK', '--json'])
      expect(code).toBe(0)
      const parsed = JSON.parse(stdout)
      expect(Array.isArray(parsed)).toBe(true)
      expect(parsed[0].id).toBe('WO_FAST_TRACK_MLA')
    })
  })

  describe('questions', () => {
    it('lists all questions', () => {
      const { stdout, code } = runCommand(['questions'])
      expect(code).toBe(0)
      const lines = stdout.split('\n').filter(Boolean)
      expect(lines.length).toBeGreaterThan(0)
    })

    it('--has-mapping filters to questions with a mapping', () => {
      const { stdout, code } = runCommand(['questions', '--has-mapping'])
      expect(code).toBe(0)
      const lines = stdout.split('\n').filter(Boolean)
      expect(lines.length).toBeGreaterThan(0)
      for (const line of lines) {
        const parts = line.split('\t')
        expect(parts[1]).not.toBe('-')
      }
    })

    it('--mapping NAME filters to exact mapping', () => {
      const { stdout, code } = runCommand(['questions', '--mapping', 'ACTIVITY_TYPE'])
      expect(code).toBe(0)
      const lines = stdout.split('\n').filter(Boolean)
      expect(lines.length).toBeGreaterThan(0)
      expect(lines[0]).toContain('/activity-type')
    })

    it('--json returns an array with route field', () => {
      const { stdout, code } = runCommand(['questions', '--mapping', 'ACTIVITY_TYPE', '--json'])
      expect(code).toBe(0)
      const parsed = JSON.parse(stdout)
      expect(Array.isArray(parsed)).toBe(true)
      expect(parsed[0].route).toBe('/activity-type')
    })
  })

  describe('mappings', () => {
    it('lists all distinct mappings alphabetically', () => {
      const { stdout, code } = runCommand(['mappings'])
      expect(code).toBe(0)
      const lines = stdout.split('\n').filter(Boolean)
      expect(lines.length).toBeGreaterThan(0)
      expect(lines[0]).toContain('\t')
      const keys = lines.map((l) => l.split('\t')[0])
      const sorted = [...keys].sort()
      expect(keys).toEqual(sorted)
    })

    it('--json emits an object keyed by mapping name', () => {
      const { stdout, code } = runCommand(['mappings', '--json'])
      expect(code).toBe(0)
      const parsed = JSON.parse(stdout)
      expect(typeof parsed).toBe('object')
      expect(Array.isArray(parsed.ACTIVITY_TYPE)).toBe(true)
      expect(parsed.ACTIVITY_TYPE).toContain('/activity-type')
    })
  })

  describe('error handling', () => {
    it('exits 2 for unknown subcommand', () => {
      const { stdout, code } = runCommand(['nonexistent'])
      expect(code).toBe(2)
      expect(stdout).toMatch(/Unknown subcommand/)
    })

    it('exits 2 with no subcommand', () => {
      const { code } = runCommand([])
      expect(code).toBe(2)
    })
  })
})
