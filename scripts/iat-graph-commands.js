import { parseArgs } from 'node:util'
import {
  getFirstQuestionRoute,
  hasQuestion,
  hasOutcome
} from '../src/server/journey/self-service/services/journey-data.js'
import { shortestPath, reach, predecessors } from './journey-graph.js'
import { parseSingleArg } from './iat-utils.js'

function choiceFromLabel(label) {
  if (label.startsWith('answer ')) {
    return label.slice('answer '.length).replace(/^"|"$/g, '')
  }
  if (label.startsWith('continue:')) {
    return 'Continue'
  }
  return label.replaceAll('"', '')
}

function formatPathHuman(steps) {
  return steps
    .map((step, index) => {
      const destination = index === steps.length - 1 ? ` → ${step.to}` : ''
      return `- ${step.from} → ${choiceFromLabel(step.label)}${destination}`
    })
    .join('\n')
}

function runPath(from, to, json) {
  const steps = shortestPath(to, { from })
  if (steps === null) {
    if (json) {
      return {
        stdout: JSON.stringify({ from, to, found: false, steps: [] }, null, 2),
        code: 1
      }
    }
    return { stdout: `No path from ${from} to ${to}`, code: 1 }
  }
  if (json) {
    return {
      stdout: JSON.stringify({ from, to, found: true, steps }, null, 2),
      code: 0
    }
  }
  return { stdout: formatPathHuman(steps), code: 0 }
}

function runReach(route, json) {
  const reachable = reach(route)
  const code = reachable ? 0 : 1
  if (json) {
    return { stdout: JSON.stringify({ route, reachable }, null, 2), code }
  }
  return {
    stdout: reachable ? `reachable: ${route}` : `not reachable: ${route}`,
    code
  }
}

function runPredecessors(route, json) {
  if (!hasQuestion(route) && !hasOutcome(route)) {
    return { stdout: `Route not found: ${route}`, code: 1 }
  }
  const callers = predecessors(route)
  if (json) {
    return { stdout: JSON.stringify(callers, null, 2), code: 0 }
  }
  if (callers.length === 0) {
    return { stdout: '(no predecessors — entry point or orphaned)', code: 0 }
  }
  return {
    stdout: callers.map((c) => `${c.route}\t${c.via}`).join('\n'),
    code: 0
  }
}

export function dispatchPath(rest) {
  const { values, positionals } = parseArgs({
    args: rest,
    options: { json: { type: 'boolean', default: false } },
    allowPositionals: true
  })
  if (positionals.length === 0) {
    return {
      stdout: 'Usage: iat-query path <to> | path <from> <to> [--json]',
      code: 2
    }
  }
  const hasFrom = positionals.length > 1
  const from = hasFrom ? positionals[0] : getFirstQuestionRoute()
  const to = hasFrom ? positionals[1] : positionals[0]
  return runPath(from, to, values.json)
}

export function dispatchReach(rest) {
  const parsed = parseSingleArg(rest, 'Usage: iat-query reach <route> [--json]')
  if (parsed.error) {
    return parsed.error
  }
  return runReach(parsed.arg, parsed.json)
}

export function dispatchPredecessors(rest) {
  const parsed = parseSingleArg(
    rest,
    'Usage: iat-query predecessors <route> [--json]'
  )
  if (parsed.error) {
    return parsed.error
  }
  return runPredecessors(parsed.arg, parsed.json)
}
