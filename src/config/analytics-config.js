const GOOGLE_TAG_MANAGER_KEY_PATTERN = /^GTM-[A-Z0-9]+$/

const REQUIRED_ANALYTICS_IDS = [
  {
    key: 'clarityProjectId',
    envVar: 'CLARITY_PROJECT_ID',
    environments: ['prod', 'perf-test']
  },
  {
    key: 'googleTagManagerKey',
    envVar: 'GOOGLE_TAG_MANAGER_KEY',
    environments: ['prod']
  }
]

const warn = (message) => {
  // eslint-disable-next-line no-console
  console.warn(`\n⚠️  WARNING: ${message}\n`)
}

export const sanitiseGoogleTagManagerKey = (config) => {
  const key = config.get('googleTagManagerKey')

  if (key && !GOOGLE_TAG_MANAGER_KEY_PATTERN.test(key)) {
    warn(
      'GOOGLE_TAG_MANAGER_KEY is not a valid GTM container ID (expected GTM-XXXXXXX); Google Analytics is disabled'
    )
    config.set('googleTagManagerKey', '')
  }
}

export const warnIfAnalyticsIdsMissing = (config) => {
  const environment = config.get('cdpEnvironment')

  for (const { key, envVar, environments } of REQUIRED_ANALYTICS_IDS) {
    if (environments.includes(environment) && !config.get(key)) {
      warn(`${envVar} is not set for ${environment} environment`)
    }
  }
}
