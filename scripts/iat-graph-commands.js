import { parseArgs } from 'node:util'
import {
  getFirstQuestionRoute,
  hasQuestion,
  hasOutcome
} from '../src/server/journey/self-service/services/journey-data.js'
import { shortestPath, reach, predecessors } from './journey-graph.js'
import { runSingleArg, jsonResult, notFound, JSON_FLAG } from './iat-utils.js'

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
      return jsonResult({ from, to, found: false, steps: [] }, 1)
    }
    return { stdout: `No path from ${from} to ${to}`, code: 1 }
  }
  if (json) {
    return jsonResult({ from, to, found: true, steps })
  }
  return { stdout: formatPathHuman(steps), code: 0 }
}

function runReach(route, json) {
  const reachable = reach(route)
  const code = reachable ? 0 : 1
  if (json) {
    return jsonResult({ route, reachable }, code)
  }
  return {
    stdout: reachable ? `reachable: ${route}` : `not reachable: ${route}`,
    code
  }
}

function runPredecessors(route, json) {
  if (!hasQuestion(route) && !hasOutcome(route)) {
    return notFound('Route', route)
  }
  const callers = predecessors(route)
  if (json) {
    return jsonResult(callers)
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
    options: { json: JSON_FLAG },
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
  return runSingleArg(rest, 'Usage: iat-query reach <route> [--json]', runReach)
}

export function dispatchPredecessors(rest) {
  return runSingleArg(
    rest,
    'Usage: iat-query predecessors <route> [--json]',
    runPredecessors
  )
}
