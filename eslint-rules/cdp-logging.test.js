import { RuleTester } from 'eslint'
import rule from './cdp-logging.js'

const ruleTester = new RuleTester({
  languageOptions: {
    ecmaVersion: 2024,
    sourceType: 'module'
  }
})

ruleTester.run('cdp-logging', rule, {
  valid: [
    {
      code: `logger.info({ event: { action: 'ok', reference: id } }, 'done')`
    },
    {
      code: `request.logger.error({ err: error, event: { action: 'fail' } }, 'oops')`
    },
    {
      code: `this.logger.warn({ error: { message: 'x', type: 'Error' } }, 'oops')`
    },
    {
      code: `logger.info('plain message only')`
    },
    {
      code: `logger.error(error, 'Error as first arg is fine')`
    },
    {
      code: `notALogger.info({ custom: true }, 'ignored')`
    },
    {
      code: `logger.info({ 'span.id': 'abc', tenant: { id: 't1', message: 'ctx' } }, 'ok')`
    },
    {
      code: `logger.info({ http: { response: { status_code: 404 } } }, 'not found')`
    },
    {
      code: `logger.child({ event: { action: 'scoped' } })`
    }
  ],
  invalid: [
    {
      code: `logger.info({ exemptionId }, 'deleted')`,
      errors: [{ messageId: 'disallowedTopLevel', data: { key: 'exemptionId' } }]
    },
    {
      code: `request.logger.error({ err: e, uploadId, status }, 'fail')`,
      errors: [
        { messageId: 'disallowedTopLevel', data: { key: 'uploadId' } },
        { messageId: 'disallowedTopLevel', data: { key: 'status' } }
      ]
    },
    {
      code: `logger.error({ error: { foo: 'bar' } }, 'bad nested')`,
      errors: [{ messageId: 'disallowedNested', data: { key: 'error.foo' } }]
    },
    {
      code: `logger.info({ service: { name: 'x', type: 'web' } }, 'reserved')`,
      errors: [{ messageId: 'disallowedNested', data: { key: 'service.name' } }]
    },
    {
      code: `logger.info({ ...ctx, event: { action: 'a' } }, 'spread')`,
      errors: [{ messageId: 'noSpread', data: { path: 'top-level' } }]
    },
    {
      code: `this.logger.debug({ ['dyn']: 1 }, 'dyn')`,
      errors: [{ messageId: 'dynamicKey', data: { path: 'top-level' } }]
    }
  ]
})
