/**
 * ESLint rule: structured logger payloads must use CDP-indexed ECS fields only.
 *
 * Allowlist matches CDP Portal → Documentation → Logging (✅ / ✅⚠️ fields).
 * Also allows Pino/hapi-pino merge keys: `err`, `req`, `res`.
 *
 * @see https://portal.cdp-int.defra.cloud/documentation/how-to/logging.md
 */

const LOG_METHODS = new Set([
  'trace',
  'debug',
  'info',
  'warn',
  'error',
  'fatal',
  'child'
])

/** Top-level keys apps may set (plus Pino helpers). */
const ALLOWED_TOP_LEVEL = new Set([
  'message',
  'host.hostname',
  'log.level',
  'span.id',
  'transaction.id',
  'client',
  'error',
  'event',
  'http',
  'log',
  'process',
  'server',
  'service',
  'tenant',
  'url',
  'user_agent',
  // Pino / ecs-pino-format / hapi-pino — remapped by serializers / pipeline
  'err',
  'req',
  'res'
])

/** Nested keys allowed under each object-shaped top-level field. */
const ALLOWED_NESTED = {
  client: new Set(['address', 'ip', 'port']),
  error: new Set(['code', 'id', 'message', 'stack_trace', 'type']),
  event: new Set([
    'action',
    'category',
    'created',
    'duration',
    'kind',
    'outcome',
    'reason',
    'reference',
    'severity',
    'type'
  ]),
  http: new Set(['request', 'response']),
  log: new Set(['file', 'logger']),
  process: new Set(['name', 'pid', 'thread']),
  server: new Set(['address']),
  service: new Set(['type']),
  tenant: new Set(['id', 'message']),
  url: new Set(['domain', 'full', 'path', 'port', 'query']),
  user_agent: new Set(['device', 'name', 'original', 'version'])
}

const ALLOWED_DEEPER = {
  'http.request': new Set(['body', 'bytes', 'headers', 'id', 'method']),
  'http.request.body': new Set(['bytes']),
  'http.request.headers': new Set([
    'Accept-language',
    'accept-encoding',
    'cache-control',
    'expires',
    'referer'
  ]),
  'http.response': new Set(['status_code']),
  'log.file': new Set(['path']),
  'process.thread': new Set(['id', 'name']),
  'user_agent.device': new Set(['name'])
}

/**
 * @param {import('estree').Node | null | undefined} node
 * @returns {boolean}
 */
function isLoggerCallee(node) {
  if (!node || node.type !== 'MemberExpression' || node.computed) {
    return false
  }

  if (node.property.type !== 'Identifier' || !LOG_METHODS.has(node.property.name)) {
    return false
  }

  // logger.info / request.logger.info / this.logger.info / createLogger().info
  if (node.object.type === 'Identifier' && node.object.name === 'logger') {
    return true
  }

  if (
    node.object.type === 'MemberExpression' &&
    !node.object.computed &&
    node.object.property.type === 'Identifier' &&
    node.object.property.name === 'logger'
  ) {
    return true
  }

  return false
}

/**
 * @param {import('estree').Property} prop
 * @returns {string | null}
 */
function propertyKeyName(prop) {
  // Computed keys (including `['span.id']`) are treated as dynamic — callers
  // must use non-computed literals for dotted flat CDP fields.
  if (prop.computed) {
    return null
  }

  if (prop.key.type === 'Identifier') {
    return prop.key.name
  }

  if (prop.key.type === 'Literal' && typeof prop.key.value === 'string') {
    return prop.key.value
  }

  return null
}

/**
 * @param {import('eslint').Rule.RuleContext} context
 * @param {import('estree').ObjectExpression} objectExpression
 * @param {string} pathPrefix
 * @param {Set<string> | null} allowedKeys
 */
function checkObjectKeys(context, objectExpression, pathPrefix, allowedKeys) {
  for (const prop of objectExpression.properties) {
    if (prop.type === 'SpreadElement') {
      context.report({
        node: prop,
        messageId: 'noSpread',
        data: { path: pathPrefix || 'top-level' }
      })
      continue
    }

    if (prop.type !== 'Property') {
      continue
    }

    const key = propertyKeyName(prop)

    if (key === null) {
      context.report({
        node: prop.key,
        messageId: 'dynamicKey',
        data: { path: pathPrefix || 'top-level' }
      })
      continue
    }

    const fullPath = pathPrefix ? `${pathPrefix}.${key}` : key

    if (allowedKeys && !allowedKeys.has(key)) {
      context.report({
        node: prop.key,
        messageId: pathPrefix ? 'disallowedNested' : 'disallowedTopLevel',
        data: { key: fullPath }
      })
      continue
    }

    if (prop.value.type !== 'ObjectExpression') {
      continue
    }

    if (!pathPrefix && ALLOWED_NESTED[key]) {
      checkObjectKeys(context, prop.value, key, ALLOWED_NESTED[key])
      continue
    }

    const deeperAllowed = ALLOWED_DEEPER[fullPath]

    if (deeperAllowed) {
      checkObjectKeys(context, prop.value, fullPath, deeperAllowed)
    }
  }
}

/** @type {import('eslint').Rule.RuleModule} */
const rule = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Require logger merge objects to use CDP-indexed ECS fields only',
      recommended: true
    },
    schema: [],
    messages: {
      disallowedTopLevel:
        "CDP logging: '{{key}}' is not an indexed ECS field. Use allowed fields (event.*, error.*, tenant.*, message, err, …) so logs appear in OpenSearch.",
      disallowedNested:
        "CDP logging: '{{key}}' is not an allowed nested field in the CDP ECS schema.",
      noSpread:
        'CDP logging: do not spread objects into logger payloads at {{path}}; list allowed ECS fields explicitly.',
      dynamicKey:
        'CDP logging: dynamic keys are not allowed in logger payloads at {{path}}; use CDP ECS field names.'
    }
  },

  create(context) {
    return {
      CallExpression(node) {
        if (!isLoggerCallee(node.callee) || node.arguments.length === 0) {
          return
        }

        // logger.child({ ... }) configures bindings — still must be CDP-safe
        const firstArg = node.arguments[0]

        if (firstArg?.type === 'ObjectExpression') {
          checkObjectKeys(context, firstArg, '', ALLOWED_TOP_LEVEL)
        }
      }
    }
  }
}

export default rule
