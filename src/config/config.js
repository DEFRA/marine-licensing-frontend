import convict from 'convict'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { configDotenv } from 'dotenv'

const dirname = path.dirname(fileURLToPath(import.meta.url))

const oneDay = 1000 * 60 * 60 * 24
const fourHoursMs = 14400000
const oneWeekMs = 604800000
const fiftyMB = 50_000_000 // 50 MB :== 50 * 1000 * 1000
const localhost = 'http://localhost:3000'

const isProduction = process.env.NODE_ENV === 'production'
const isTest = process.env.NODE_ENV === 'test'
const isDevelopment = process.env.NODE_ENV === 'development'

if (isDevelopment) {
  configDotenv()
}

export const config = convict({
  serviceVersion: {
    doc: 'The service version, this variable is injected into your docker container in CDP environments',
    format: String,
    nullable: true,
    default: null,
    env: 'SERVICE_VERSION'
  },
  env: {
    doc: 'The application environment.',
    format: ['production', 'development', 'test'],
    default: 'development',
    env: 'NODE_ENV'
  },
  port: {
    doc: 'The port to bind.',
    format: 'port',
    default: 3000,
    env: 'PORT'
  },
  staticCacheTimeout: {
    doc: 'Static cache timeout in milliseconds',
    format: Number,
    default: oneWeekMs,
    env: 'STATIC_CACHE_TIMEOUT'
  },
  serviceName: {
    doc: 'Applications Service Name',
    format: String,
    default: 'Get permission for marine work'
  },
  appBaseUrl: {
    doc: 'Base URL for the application (used for CDP upload redirects)',
    format: String,
    default: localhost,
    env: 'APP_BASE_URL'
  },
  root: {
    doc: 'Project root',
    format: String,
    default: path.resolve(dirname, '../..')
  },
  assetPath: {
    doc: 'Asset path',
    format: String,
    default: '/public',
    env: 'ASSET_PATH'
  },
  isProduction: {
    doc: 'If this application running in the production environment',
    format: Boolean,
    default: isProduction
  },
  isDevelopment: {
    doc: 'If this application running in the development environment',
    format: Boolean,
    default: isDevelopment
  },
  isTest: {
    doc: 'If this application running in the test environment',
    format: Boolean,
    default: isTest
  },
  log: {
    enabled: {
      doc: 'Is logging enabled',
      format: Boolean,
      default: process.env.NODE_ENV !== 'test',
      env: 'LOG_ENABLED'
    },
    level: {
      doc: 'Logging level',
      format: ['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent'],
      default: 'info',
      env: 'LOG_LEVEL'
    },
    format: {
      doc: 'Format to output logs in.',
      format: ['ecs', 'pino-pretty'],
      default: isProduction ? 'ecs' : 'pino-pretty',
      env: 'LOG_FORMAT'
    },
    redact: {
      doc: 'Log paths to redact',
      format: Array,
      default: isProduction
        ? ['req.headers.authorization', 'req.headers.cookie', 'res.headers']
        : []
    }
  },
  httpProxy: /** @type {SchemaObj<string | null>} */ ({
    doc: 'HTTP Proxy',
    format: String,
    nullable: true,
    default: null,
    env: 'HTTP_PROXY'
  }),
  isSecureContextEnabled: {
    doc: 'Enable Secure Context',
    format: Boolean,
    default: isProduction,
    env: 'ENABLE_SECURE_CONTEXT'
  },
  isMetricsEnabled: {
    doc: 'Enable metrics reporting',
    format: Boolean,
    default: isProduction,
    env: 'ENABLE_METRICS'
  },
  session: {
    cache: {
      engine: {
        doc: 'backend cache is written to',
        format: ['redis', 'memory'],
        default: isProduction ? 'redis' : 'memory',
        env: 'SESSION_CACHE_ENGINE'
      },
      name: {
        doc: 'server side session cache name',
        format: String,
        default: 'session',
        env: 'SESSION_CACHE_NAME'
      },
      ttl: {
        doc: 'server side session cache ttl',
        format: Number,
        default: fourHoursMs,
        env: 'SESSION_CACHE_TTL'
      }
    },
    cookie: {
      ttl: {
        doc: 'Session cookie ttl',
        format: Number,
        default: fourHoursMs,
        env: 'SESSION_COOKIE_TTL'
      },
      password: {
        doc: 'session cookie password',
        format: String,
        default: 'the-password-must-be-at-least-32-characters-long',
        env: 'SESSION_COOKIE_PASSWORD',
        sensitive: true
      },
      secure: {
        doc: 'set secure flag on cookie',
        format: Boolean,
        default: isProduction,
        env: 'SESSION_COOKIE_SECURE'
      }
    }
  },
  redis: /** @type {Schema<RedisConfig>} */ ({
    host: {
      doc: 'Redis cache host',
      format: String,
      default: '127.0.0.1',
      env: 'REDIS_HOST'
    },
    username: {
      doc: 'Redis cache username',
      format: String,
      default: '',
      env: 'REDIS_USERNAME'
    },
    password: {
      doc: 'Redis cache password',
      format: '*',
      default: '',
      sensitive: true,
      env: 'REDIS_PASSWORD'
    },
    keyPrefix: {
      doc: 'Redis cache key prefix name used to isolate the cached results across multiple clients',
      format: String,
      default: 'marine-licensing-frontend:',
      env: 'REDIS_KEY_PREFIX'
    },
    ttl: {
      doc: 'Redis cache global ttl',
      format: Number,
      default: oneDay,
      env: 'REDIS_TTL'
    },
    useSingleInstanceCache: {
      doc: 'Connect to a single instance of redis instead of a cluster.',
      format: Boolean,
      default: !isProduction,
      env: 'USE_SINGLE_INSTANCE_CACHE'
    },
    useTLS: {
      doc: 'Connect to redis using TLS',
      format: Boolean,
      default: isProduction,
      env: 'REDIS_TLS'
    }
  }),
  nunjucks: {
    watch: {
      doc: 'Reload templates when they are changed.',
      format: Boolean,
      default: isDevelopment
    },
    noCache: {
      doc: 'Use a cache and recompile templates each time',
      format: Boolean,
      default: isDevelopment
    }
  },
  tracing: {
    header: {
      doc: 'Which header to track',
      format: String,
      default: 'x-cdp-request-id',
      env: 'TRACING_HEADER'
    }
  },
  backend: {
    apiUrl: {
      doc: 'Endpoint for the backend API service',
      format: String,
      nullable: true,
      default: 'http://localhost:3001',
      env: 'MARINE_LICENSING_BACKEND_API_URL'
    }
  },
  defraId: {
    accountManagementUrl: {
      doc: 'Defra ID account management portal URL',
      format: String,
      env: 'DEFRA_ID_ACCOUNT_MANAGEMENT_URL',
      default: '#'
    },
    oidcConfigurationUrl: {
      doc: 'Defra ID OIDC Configuration URL',
      format: String,
      default:
        'http://localhost:3200/cdp-defra-id-stub/.well-known/openid-configuration',
      env: 'DEFRA_ID_OIDC_CONFIGURATION_URL'
    },
    clientId: {
      doc: 'The Defra Identity client ID.',
      format: String,
      default: '2fb0d715-affa-4bf1-836e-44a464e3fbea',
      env: 'DEFRA_ID_CLIENT_ID'
    },
    clientSecret: {
      doc: 'The Defra Identity client secret.',
      format: String,
      default: 'test_value',
      env: 'DEFRA_ID_CLIENT_SECRET',
      sensitive: true
    },
    serviceId: {
      doc: 'The Defra Identity service ID.',
      format: String,
      default: 'service-test',
      env: 'DEFRA_ID_SERVICE_ID'
    },
    scopes: {
      doc: 'Defra ID Scopes',
      format: Array,
      sensitive: true,
      env: 'AUTH_DEFRA_ID_SCOPES',
      default: ['openid', 'offline_access']
    },
    redirectUrl: {
      doc: 'The Defra Identity redirect URl.',
      format: String,
      default: localhost,
      env: 'APP_BASE_URL'
    },
    refreshTokens: {
      doc: 'True if Defra Identity refresh tokens are enabled.',
      format: Boolean,
      default: true,
      env: 'DEFRA_ID_REFRESH_TOKENS'
    }
  },
  entraId: {
    oidcConfigurationUrl: {
      doc: 'Entra ID OIDC configuration URL',
      format: String,
      env: 'ENTRA_ID_OIDC_CONFIGURATION_URL',
      default:
        'http://localhost:3200/cdp-defra-id-stub/.well-known/openid-configuration'
    },
    clientId: {
      doc: 'ENTRA ID client ID',
      format: String,
      env: 'ENTRA_ID_CLIENT_ID',
      default: 'f68226cb-8dbc-44ef-a24e-d4e4835b16ff'
    },
    clientSecret: {
      doc: 'ENTRA ID client secret',
      format: String,
      sensitive: true,
      env: 'ENTRA_ID_CLIENT_SECRET',
      default: 'test_value'
    },
    scopes: {
      doc: 'ENTRA ID scopes',
      format: Array,
      sensitive: true,
      env: 'ENTRA_ID_SCOPES',
      default: ['api://f68226cb-8dbc-44ef-a24e-d4e4835b16ff/.default']
    },
    redirectUrl: {
      doc: 'ENTRA ID redirect URl.',
      format: String,
      default: localhost,
      env: 'APP_BASE_URL'
    }
  },
  cdpUploader: {
    cdpUploadServiceBaseUrl: {
      doc: 'CDP Uploader service base URL',
      format: String,
      default: 'http://localhost:7337',
      env: 'CDP_UPLOADER_BASE_URL'
    },
    timeout: {
      doc: 'Request timeout for CDP Uploader calls in milliseconds',
      format: Number,
      default: 30000,
      env: 'CDP_UPLOADER_TIMEOUT'
    },
    maxFileSize: {
      doc: 'Maximum file size in bytes (50MB)',
      format: Number,
      default: fiftyMB,
      env: 'CDP_UPLOADER_MAX_FILE_SIZE'
    },
    s3Bucket: {
      doc: 'S3 Bucket for uploads to be placed in after the virus scan',
      format: String,
      default: 'mmo-uploads',
      env: 'CDP_UPLOAD_BUCKET'
    }
  },
  clarityProjectId: {
    doc: 'Microsoft Clarity Project ID',
    format: String,
    default: '',
    env: 'CLARITY_PROJECT_ID'
  }
})

config.validate({ allowed: 'strict' })

/**
 * @import { Schema, SchemaObj } from 'convict'
 * @import { RedisConfig } from '~/src/server/common/helpers/redis-client.js'
 */
