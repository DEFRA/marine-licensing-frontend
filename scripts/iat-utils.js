import { parseArgs } from 'node:util'
import { calculateNextRoute } from '../src/server/journey/self-service/services/journey-router.js'

const EXCERPT_LEN = 60
const MAX_TEXT_FOR_STRIP = 10000

export const JSON_FLAG = { type: 'boolean', default: false }

export function jsonResult(value, code = 0) {
  return { stdout: JSON.stringify(value, null, 2), code }
}

export function notFound(label, id) {
  return { stdout: `${label} not found: ${id}`, code: 1 }
}

const KEY_VALUE_GAP = 2

export function alignKeyValues(rows) {
  const width = Math.max(...rows.map(([key]) => key.length)) + KEY_VALUE_GAP
  return rows.map(([key, value]) => `${key.padEnd(width)}${value}`)
}

export function excerpt(text) {
  if (!text) {
    return '-'
  }
  const bounded =
    text.length > MAX_TEXT_FOR_STRIP ? text.slice(0, MAX_TEXT_FOR_STRIP) : text
  const stripped = bounded.replaceAll(/<[^>]+>/g, '').trim()
  if (stripped.length <= EXCERPT_LEN) {
    return stripped
  }
  return stripped.slice(0, EXCERPT_LEN) + '…'
}

export function dash(value) {
  if (value === null || value === undefined || value === '') {
    return '-'
  }
  return String(value)
}

export function targetForAnswer(answer, question) {
  try {
    const next = calculateNextRoute(question, [answer.id])
    return `${next.type} ${next.route}`
  } catch {
    return 'terminal'
  }
}

export function paramsFlat(outcomeType) {
  const params = outcomeType.params
  if (!params || params.length === 0) {
    return '-'
  }
  return params.map((p) => `${p.name}=${p.value}`).join(' ')
}

function parseSingleArg(rest, usage) {
  const { values, positionals } = parseArgs({
    args: rest,
    options: { json: JSON_FLAG },
    allowPositionals: true
  })
  const arg = positionals[0]
  if (!arg) {
    return { error: { stdout: usage, code: 2 } }
  }
  return { arg, json: values.json }
}

export function runSingleArg(rest, usage, run) {
  const parsed = parseSingleArg(rest, usage)
  if (parsed.error) {
    return parsed.error
  }
  return run(parsed.arg, parsed.json)
}

export function parseHasParam(hasParam) {
  if (!hasParam) {
    return { name: null, value: null }
  }
  const eqIdx = hasParam.indexOf('=')
  if (eqIdx === -1) {
    return { name: hasParam, value: null }
  }
  return { name: hasParam.slice(0, eqIdx), value: hasParam.slice(eqIdx + 1) }
}
