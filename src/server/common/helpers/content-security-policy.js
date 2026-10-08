import { config } from '#src/config/config.js'
import { randomBytes } from 'node:crypto'

const SELF = "'self'"
const NONE = "'none'"
// Hash of the inline script in govuk-frontend's page template. Re-verify on every govuk-frontend upgrade:
// https://frontend.design-system.service.gov.uk/import-javascript/#if-our-inline-javascript-snippet-is-blocked-by-a-content-security-policy
const GOVUK_FRONTEND_INLINE_SCRIPT_HASH =
  "'sha256-GUQ5ad8JK5KmEWmROf3LZd9ge94daqNvd8xy9YS1iDw='"

const GOOGLE_TAG_MANAGER_HOST = 'https://www.googletagmanager.com'
const GOOGLE_TAG_MANAGER_PREVIEW_HOST = 'https://tagmanager.google.com'
// The apex host is listed separately because a *.analytics.google.com wildcard does not match it
const GOOGLE_ANALYTICS_HOSTS = [
  'https://*.google-analytics.com',
  'https://analytics.google.com',
  'https://*.analytics.google.com'
]

const baseDirectives = ({ uploaderServiceHost, cspRedirectHosts }) => ({
  'base-uri': [SELF],
  'connect-src': [SELF],
  'default-src': [SELF],
  'font-src': [SELF],
  'form-action': [SELF, uploaderServiceHost, ...cspRedirectHosts],
  'frame-src': [SELF],
  'frame-ancestors': [NONE],
  'img-src': [SELF, 'https://tile.openstreetmap.org'],
  'manifest-src': [SELF],
  'media-src': [SELF],
  'object-src': [NONE],
  'script-src': [SELF, GOVUK_FRONTEND_INLINE_SCRIPT_HASH],
  'style-src': [SELF]
})

const clarityDirectives = (clarityProjectId) => {
  if (!clarityProjectId) {
    return {}
  }
  return {
    'script-src': [
      `https://www.clarity.ms/tag/${clarityProjectId}`,
      'https://scripts.clarity.ms'
    ],
    'connect-src': ['https://*.clarity.ms/collect']
  }
}

const googleTagManagerDirectives = (googleTagManagerKey) => {
  if (!googleTagManagerKey) {
    return {}
  }
  return {
    'script-src': [GOOGLE_TAG_MANAGER_HOST],
    'connect-src': [
      GOOGLE_TAG_MANAGER_HOST,
      ...GOOGLE_ANALYTICS_HOSTS,
      'https://www.google.com'
    ],
    'img-src': [GOOGLE_TAG_MANAGER_HOST, ...GOOGLE_ANALYTICS_HOSTS],
    'frame-src': [GOOGLE_TAG_MANAGER_HOST]
  }
}

// Tag Assistant preview mode needs these; only allowed outside production
const googleTagManagerPreviewDirectives = (
  googleTagManagerKey,
  includePreviewHosts
) => {
  if (!googleTagManagerKey || !includePreviewHosts) {
    return {}
  }
  return {
    'script-src': [GOOGLE_TAG_MANAGER_PREVIEW_HOST],
    'style-src': [
      GOOGLE_TAG_MANAGER_HOST,
      GOOGLE_TAG_MANAGER_PREVIEW_HOST,
      'https://fonts.googleapis.com'
    ],
    'img-src': ['https://ssl.gstatic.com', 'https://www.gstatic.com'],
    'font-src': ['https://fonts.gstatic.com', 'data:']
  }
}

const mergeDirectives = (...directiveSets) => {
  const merged = {}
  for (const directives of directiveSets) {
    for (const [name, sources] of Object.entries(directives)) {
      merged[name] = [...(merged[name] ?? []), ...sources]
    }
  }
  return merged
}

export const buildContentSecurityPolicy = ({
  nonce,
  uploaderServiceHost,
  cspRedirectHosts,
  clarityProjectId,
  googleTagManagerKey,
  includePreviewHosts
}) => {
  const directives = mergeDirectives(
    baseDirectives({ uploaderServiceHost, cspRedirectHosts }),
    clarityDirectives(clarityProjectId),
    googleTagManagerDirectives(googleTagManagerKey),
    googleTagManagerPreviewDirectives(googleTagManagerKey, includePreviewHosts),
    { 'script-src': [`'nonce-${nonce}'`] }
  )

  return Object.entries(directives)
    .map(([name, sources]) => `${name} ${sources.join(' ')}`)
    .join('; ')
}

export const contentSecurityPolicy = {
  name: 'content-security-policy',
  register: (server) => {
    const settings = {
      uploaderServiceHost: config.get('cdpUploader.cdpUploadServiceBaseUrl'),
      cspRedirectHosts: config.get('defraId.cspRedirectHosts'),
      clarityProjectId: config.get('clarityProjectId'),
      googleTagManagerKey: config.get('googleTagManagerKey'),
      includePreviewHosts: config.get('cdpEnvironment') !== 'prod'
    }

    server.ext('onPreResponse', (request, h) => {
      const { response } = request
      const cspNonce = randomBytes(16).toString('hex')

      response.header?.(
        'Content-Security-Policy',
        buildContentSecurityPolicy({ ...settings, nonce: cspNonce })
      )

      if (response.variety === 'view') {
        response.source.context = { ...response.source.context, cspNonce }
      }

      return h.continue
    })
  }
}
