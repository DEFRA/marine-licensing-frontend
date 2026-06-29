/**
 * IAT query CLI — read-only inspection of self-service.json.
 *
 * Usage:
 *   npm run iat                              # prints usage
 *   npm run iat -- <subcommand> [args] [--json]
 *
 * Subcommands:
 *   question <route>                                  one question + answers + targets
 *   outcome <route>                                   one outcome + inline outcomeTypes
 *   outcome-type <id>                                 one outcomeType (params, link, module, nextQuestionRoute)
 *   outcomes [--classify X] [--has-param N[=V]] [--has-link]   list outcomes filtered by classification/param/link
 *   outcome-types [--has-param N[=V]] [--has-next-question] [--has-link]
 *   questions [--mapping N] [--has-mapping]           list questions by mcmsAppFormMapping
 *   mappings                                          distinct mappings + carrier question routes
 *   path [<from>] <to>                                shortest journey through the graph (from defaults to /sea)
 *   reach <route>                                     reachable from /sea? (exit 0 reachable, 1 not)
 *   predecessors <route>                              pages that route directly into this node
 *
 * Examples:
 *   npm run iat -- path /mod-permission
 *       print one shortest click-by-click journey from /sea to a page
 *   npm run iat -- question /activity-type
 *       inspect one question, its answers, and where each answer branches to
 *   npm run iat -- outcome /scaffolding-impede-navigation
 *       inspect an outcome's heading, classification, and inline outcomeTypes
 *   npm run iat -- outcomes --has-link
 *       list every outcome route that surfaces a downloadable asset (e.g. .docx templates)
 *   npm run iat -- outcome-types --has-link --json
 *       resolve the link-bearing outcomeTypes to their actual asset URLs
 *   npm run iat -- mappings
 *       list the distinct MCMS form mappings and the question routes carrying each
 *
 * Every subcommand accepts --json for machine-readable output.
 * Exit codes: 0 success, 1 not-found, 2 invalid args.
 *
 * Reuses journey-data.js's parsed/sanitised view so the CLI sees what the running app sees.
 */

import { parseArgs } from 'node:util'
import {
  getJourneyData,
  getQuestion,
  getOutcome,
  getOutcomeType,
  getOutcomeTypesForOutcome
} from '../src/server/journey/self-service/services/journey-data.js'
import { classifyOutcome } from '../src/server/journey/self-service/outcome/utils.js'
import {
  excerpt,
  dash,
  paramsFlat,
  targetForAnswer,
  parseHasParam,
  runSingleArg,
  jsonResult,
  notFound,
  alignKeyValues,
  JSON_FLAG
} from './iat-utils.js'
import {
  dispatchPath,
  dispatchReach,
  dispatchPredecessors
} from './iat-graph-commands.js'

const USAGE = `iat-query — inspect the self-service IAT journey (self-service.json)

Most common question — "how do I reach a page?":
  npm run iat -- path /mod-permission           one shortest journey from /sea
  npm run iat -- path /sea /mod-permission        between two routes
  npm run iat -- reach /mod-permission            reachable? (exit 0/1)
  npm run iat -- predecessors /activity/completion  pages that lead directly here

Inspect a node:
  question <route> | outcome <route> | outcome-type <id>

List / filter:
  outcomes [--classify X] [--has-param N[=V]] [--has-link]
  outcome-types [--has-param N[=V]] [--has-next-question] [--has-link]
  questions [--mapping N] [--has-mapping]
  mappings

The journey is a graph of three node types (questions, outcomes,
outcomeTypes). Routing happens four ways: single-select answers,
multi-select pages (multiSelect.questionRoute / outcomeRoute), and
outcome forks (outcomeType.nextQuestionRoute). All documented in:
  src/server/journey/self-service/data/README.data.md

Add --json to any subcommand for machine-readable output.`

function runQuestion(route, json) {
  const q = getQuestion(route)
  if (!q) {
    return notFound('Question', route)
  }
  if (json) {
    const doc = {
      route: q.route,
      text: q.text,
      mcmsAppFormMapping: q.mcmsAppFormMapping ?? null,
      multiSelect: q.multiSelect ?? false,
      section: q.section ?? null,
      answers: q.answers.map((a) => ({
        id: a.id,
        text: a.text,
        target: targetForAnswer(a, q)
      }))
    }
    return jsonResult(doc)
  }
  const lines = [
    ...alignKeyValues([
      ['route', q.route],
      ['text', q.text],
      ['mapping', dash(q.mcmsAppFormMapping)],
      ['multiSelect', q.multiSelect ? 'yes' : 'no'],
      ['section', dash(q.section)]
    ]),
    '',
    '  ANSWERS',
    '  id\ttext\ttarget'
  ]
  for (const a of q.answers) {
    lines.push(`  ${a.id}\t${excerpt(a.text)}\t${targetForAnswer(a, q)}`)
  }
  return { stdout: lines.join('\n'), code: 0 }
}

function runOutcome(route, json) {
  const o = getOutcome(route)
  if (!o) {
    return notFound('Outcome', route)
  }
  const classification = classifyOutcome(o)
  const types = getOutcomeTypesForOutcome(o)
  if (json) {
    const doc = {
      route: o.route,
      heading: o.heading,
      text: o.text ?? null,
      classification,
      outcomeTypes: types.map((ot) => ({
        id: ot.id,
        text: ot.text ?? null,
        params: ot.params ?? [],
        nextQuestionRoute: ot.nextQuestionRoute ?? null
      }))
    }
    return jsonResult(doc)
  }
  const lines = [
    ...alignKeyValues([
      ['route', o.route],
      ['heading', o.heading],
      ['text', excerpt(o.text)],
      ['classification', classification]
    ]),
    '',
    '  OUTCOME TYPES',
    '  id\ttext\tparams\tnextQuestionRoute'
  ]
  for (const ot of types) {
    lines.push(
      `  ${ot.id}\t${excerpt(ot.text)}\t${paramsFlat(ot)}\t${dash(ot.nextQuestionRoute)}`
    )
  }
  return { stdout: lines.join('\n'), code: 0 }
}

function runOutcomeType(id, json) {
  const ot = getOutcomeType(id)
  if (!ot) {
    return notFound('OutcomeType', id)
  }
  if (json) {
    const doc = {
      id: ot.id,
      heading: ot.heading,
      text: ot.text ?? null,
      params: ot.params ?? [],
      nextQuestionRoute: ot.nextQuestionRoute ?? null,
      link: ot.link ?? null,
      module: ot.module ?? null,
      entryTheme: ot.entryTheme ?? null,
      overrideCtaButtonText: ot.overrideCtaButtonText ?? null
    }
    return jsonResult(doc)
  }
  const lines = alignKeyValues([
    ['id', ot.id],
    ['heading', ot.heading],
    ['text', excerpt(ot.text)],
    ['params', paramsFlat(ot)],
    ['nextQuestionRoute', dash(ot.nextQuestionRoute)],
    ['link', dash(ot.link)],
    ['module', dash(ot.module)],
    ['entryTheme', dash(ot.entryTheme)],
    ['overrideCtaButtonText', dash(ot.overrideCtaButtonText)]
  ])
  return { stdout: lines.join('\n'), code: 0 }
}

function outcomeTypeMatchesHasParam(ot, paramName, paramValue) {
  if (!ot.params || ot.params.length === 0) {
    return false
  }
  return ot.params.some((p) => {
    if (p.name !== paramName) {
      return false
    }
    return paramValue === null || p.value === paramValue
  })
}

function outcomeMatchesHasParam(outcome, paramName, paramValue) {
  const types = getOutcomeTypesForOutcome(outcome)
  return types.some((ot) =>
    outcomeTypeMatchesHasParam(ot, paramName, paramValue)
  )
}

function outcomeHasLink(outcome) {
  return getOutcomeTypesForOutcome(outcome).some((ot) => Boolean(ot.link))
}

function runOutcomes(flags, json) {
  const { classify, hasParam, hasLink } = flags
  const { name: paramName, value: paramValue } = parseHasParam(hasParam)
  const data = getJourneyData()
  const filtered = data.outcomes.filter((o) => {
    const classification = classifyOutcome(o)
    if (classify && classification !== classify) {
      return false
    }
    if (paramName && !outcomeMatchesHasParam(o, paramName, paramValue)) {
      return false
    }
    if (hasLink && !outcomeHasLink(o)) {
      return false
    }
    return true
  })
  if (json) {
    const docs = filtered.map((o) => ({
      route: o.route,
      classification: classifyOutcome(o),
      outcomeTypeIds: o.outcomeTypes ?? []
    }))
    return jsonResult(docs)
  }
  const lines = filtered.map((o) => {
    const classification = classifyOutcome(o)
    const ids = (o.outcomeTypes ?? []).join(',')
    return `${o.route}\t${classification}\t${ids}`
  })
  return { stdout: lines.join('\n'), code: 0 }
}

function runOutcomeTypes(flags, json) {
  const { hasParam, hasNextQuestion, hasLink } = flags
  const { name: paramName, value: paramValue } = parseHasParam(hasParam)
  const data = getJourneyData()
  const filtered = data.outcomeTypes.filter((ot) => {
    if (paramName && !outcomeTypeMatchesHasParam(ot, paramName, paramValue)) {
      return false
    }
    if (hasNextQuestion && !ot.nextQuestionRoute) {
      return false
    }
    if (hasLink && !ot.link) {
      return false
    }
    return true
  })
  if (json) {
    return jsonResult(filtered)
  }
  const lines = filtered.map((ot) => {
    return `${ot.id}\t${paramsFlat(ot)}\t${dash(ot.nextQuestionRoute)}`
  })
  return { stdout: lines.join('\n'), code: 0 }
}

function runQuestions(flags, json) {
  const { mapping, hasMapping } = flags
  const data = getJourneyData()
  const filtered = data.questions.filter((q) => {
    if (mapping && q.mcmsAppFormMapping !== mapping) {
      return false
    }
    if (hasMapping && !q.mcmsAppFormMapping) {
      return false
    }
    return true
  })
  if (json) {
    return jsonResult(filtered)
  }
  const lines = filtered.map((q) => {
    return `${q.route}\t${dash(q.mcmsAppFormMapping)}\t${q.multiSelect ? 'yes' : 'no'}\t${excerpt(q.text)}`
  })
  return { stdout: lines.join('\n'), code: 0 }
}

function runMappings(json) {
  const data = getJourneyData()
  const mappingMap = new Map()
  for (const q of data.questions) {
    if (!q.mcmsAppFormMapping) {
      continue
    }
    const existing = mappingMap.get(q.mcmsAppFormMapping)
    if (existing) {
      existing.push(q.route)
    } else {
      mappingMap.set(q.mcmsAppFormMapping, [q.route])
    }
  }
  const sortedKeys = [...mappingMap.keys()].sort((a, b) => a.localeCompare(b))
  if (json) {
    const doc = {}
    for (const key of sortedKeys) {
      doc[key] = mappingMap.get(key)
    }
    return jsonResult(doc)
  }
  const lines = sortedKeys.map(
    (key) => `${key}\t${mappingMap.get(key).join(',')}`
  )
  return { stdout: lines.join('\n'), code: 0 }
}

function dispatchQuestion(rest) {
  return runSingleArg(
    rest,
    'Usage: iat-query question <route> [--json]',
    runQuestion
  )
}

function dispatchOutcome(rest) {
  return runSingleArg(
    rest,
    'Usage: iat-query outcome <route> [--json]',
    runOutcome
  )
}

function dispatchOutcomeType(rest) {
  return runSingleArg(
    rest,
    'Usage: iat-query outcome-type <id> [--json]',
    runOutcomeType
  )
}

function dispatchOutcomes(rest) {
  const { values } = parseArgs({
    args: rest,
    options: {
      json: JSON_FLAG,
      classify: { type: 'string' },
      'has-param': { type: 'string' },
      'has-link': { type: 'boolean', default: false }
    },
    allowPositionals: false
  })
  return runOutcomes(
    {
      classify: values.classify,
      hasParam: values['has-param'],
      hasLink: values['has-link']
    },
    values.json
  )
}

function dispatchOutcomeTypes(rest) {
  const { values } = parseArgs({
    args: rest,
    options: {
      json: JSON_FLAG,
      'has-param': { type: 'string' },
      'has-next-question': { type: 'boolean', default: false },
      'has-link': { type: 'boolean', default: false }
    },
    allowPositionals: false
  })
  return runOutcomeTypes(
    {
      hasParam: values['has-param'],
      hasNextQuestion: values['has-next-question'],
      hasLink: values['has-link']
    },
    values.json
  )
}

function dispatchQuestions(rest) {
  const { values } = parseArgs({
    args: rest,
    options: {
      json: JSON_FLAG,
      mapping: { type: 'string' },
      'has-mapping': { type: 'boolean', default: false }
    },
    allowPositionals: false
  })
  return runQuestions(
    { mapping: values.mapping, hasMapping: values['has-mapping'] },
    values.json
  )
}

function dispatchMappings(rest) {
  const { values } = parseArgs({
    args: rest,
    options: { json: JSON_FLAG },
    allowPositionals: false
  })
  return runMappings(values.json)
}

const DISPATCH = {
  question: dispatchQuestion,
  outcome: dispatchOutcome,
  'outcome-type': dispatchOutcomeType,
  outcomes: dispatchOutcomes,
  'outcome-types': dispatchOutcomeTypes,
  questions: dispatchQuestions,
  mappings: dispatchMappings,
  path: dispatchPath,
  reach: dispatchReach,
  predecessors: dispatchPredecessors
}

export function runCommand(argv) {
  const [subcommand, ...rest] = argv
  if (!subcommand) {
    return { stdout: USAGE, code: 2 }
  }
  const handler = DISPATCH[subcommand]
  if (!handler) {
    return { stdout: `Unknown subcommand: ${subcommand}`, code: 2 }
  }
  return handler(rest)
}

const isMain = import.meta.url === `file://${process.argv[1]}`

if (isMain) {
  const { stdout, code } = runCommand(process.argv.slice(2))
  // eslint-disable-next-line no-console
  console.log(stdout)
  process.exitCode = code
}
