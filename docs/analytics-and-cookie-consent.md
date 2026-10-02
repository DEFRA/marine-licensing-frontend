# Analytics and cookie consent

How analytics consent flows through the service, how Google Tag Manager (GTM) and Microsoft Clarity are gated on it, and the constraints that shaped the implementation.

## Consent state

Two host-only cookies are written together when the user answers the cookie banner or saves the cookies page:

| Cookie                    | Value                                                           | Purpose                                           |
| ------------------------- | --------------------------------------------------------------- | ------------------------------------------------- |
| `cookies_policy`          | base64json `{ essential: true, analytics: boolean, timestamp }` | The choice                                        |
| `cookies_preferences_set` | `'true'`                                                        | Whether a choice has been made (hides the banner) |

Both are HttpOnly, `Path=/`, `SameSite=Lax`, one year, `Secure` in production, with no `Domain`, so consent is not shared with other Defra services.

The banner and the cookies page are plain forms that POST to `/help/cookies`; the handler sets both cookies on a 302. There is no JavaScript on the banner. Consent takes effect on the page the user lands on after the redirect.

## What the layout renders

`layouts/page.njk` renders one nonce'd inline script on every page:

```js
window.CLARITY_PROJECT_ID = '<id or empty>'
window.ANALYTICS_ENABLED = <cookies_policy.analytics === true>
window.COOKIE_PREFERENCES_SET = <cookies_preferences_set === 'true'>
window.ENABLE_BROWSER_LOGGING = <boolean>
// only when GOOGLE_TAG_MANAGER_KEY is configured
window.dataLayer = window.dataLayer || []
function gtag() { dataLayer.push(arguments) }
gtag('consent', 'default', { ad_user_data: 'denied', ad_personalization: 'denied', ad_storage: 'denied', analytics_storage: 'denied' })
// only when analytics cookies are accepted
gtag('consent', 'update', { analytics_storage: 'granted' })
```

When a container key is configured **and** analytics is accepted, the layout also includes Google's Part A snippet in `<head>` (`partials/google-tag-manager/head.njk`) and Part B noscript iframe immediately after govuk-frontend's own inline body script (the `bodyStart` block) (`partials/google-tag-manager/body.njk`). Neither renders for undecided or rejecting users, so no Google cookies are set before consent.

Two departures from Google's paste-as-is snippets, both sanctioned by Google's CSP guide: Part A carries `nonce="{{ cspNonce }}"` and Google's nonce-aware line that copies the nonce onto the injected `gtm.js` element; Part B uses the `app-gtm-noscript` class instead of an inline `style` attribute, which `style-src 'self'` would block.

Consent reaches the container through Google Consent Mode commands, not a custom event. `gtag()` here is only the one-line shim Google documents; it writes `arguments` objects into `dataLayer`, which GTM recognises as consent state and feeds to every Google tag's consent checks. The default denies all four consent types on every page; the update grants `analytics_storage` only when the user has accepted, and ad-related storage stays denied throughout. Because GTM is loaded only after consent, this is Consent Mode's "basic" form: tags are blocked outright rather than loaded in a denied state, so no cookieless pings are sent before consent.

## Client-side cleanup

`src/client/javascripts/cookie-consent/` runs on every page. When `COOKIE_PREFERENCES_SET` is true and `ANALYTICS_ENABLED` is false it expires every cookie whose name starts `_ga`, `_gid`, `_gat` or `_dc_gtm_`, and the Clarity cookies `_clck` and `_clsk`, on the host and on every parent domain. It never runs while the user is undecided. It also reloads a page restored from the back/forward cache.

Why client-side only: Google sets `_ga*` on the registrable domain (`defra.gov.uk` in production, `defra.cloud` on CDP) with `Path=/`. hapi's `h.unstate()` emits a host-only cookie with no `Path`, which the browser treats as a different cookie, so a server-side deletion never matches. Consequences to be aware of:

- Those cookies are shared with every other Defra service on the same registrable domain, including DEFRA ID. Rejecting here deletes them for those services too.
- A user without JavaScript keeps existing `_ga*` cookies until a later page load with JavaScript.

## Microsoft Clarity

The `@microsoft/clarity` npm loader is initialised from `application.js` on every page when `CLARITY_PROJECT_ID` is set, then told the consent state. Clarity's own handling of `consent(false)` is not relied on to remove `_clck`/`_clsk`: whether it does depends on the project's Cookies setting in the Clarity dashboard and on the consent flag stored in an existing `_clck`, both of which can change without a deploy. The client-side cleanup above deletes them instead. It runs before `Clarity.init`, so Clarity then starts without a cookie and with tracking off, and continues collecting without cookies.

## Content-Security-Policy

`src/server/common/helpers/content-security-policy.js` builds the header per response. Host groups are conditional:

| Group                    | Condition                                                    | Directives                                          |
| ------------------------ | ------------------------------------------------------------ | --------------------------------------------------- |
| Clarity                  | `CLARITY_PROJECT_ID` set                                     | `script-src`, `connect-src`                         |
| Google Tag Manager / GA4 | `GOOGLE_TAG_MANAGER_KEY` set                                 | `script-src`, `connect-src`, `img-src`, `frame-src` |
| Tag Assistant preview    | `GOOGLE_TAG_MANAGER_KEY` set and `ENVIRONMENT` is not `prod` | `script-src`, `style-src`, `img-src`, `font-src`    |

`https://analytics.google.com` is listed alongside `https://*.analytics.google.com` because a wildcard does not match the apex host. There is no `'unsafe-inline'` or `'unsafe-eval'`: GTM Custom HTML tags rely on nonce propagation, and GTM Custom JavaScript variables evaluate to `undefined`. Any tag that needs another host (Google Ads, DoubleClick, third-party pixels) is a code change and a deploy.

## Error pages

`catchAll` (`src/server/common/helpers/errors.js`) is registered as the **first** `onPreResponse` extension in `src/server/index.js`, so the error view it swaps in still passes through the CSP, CSRF, cookie-banner, session and cache-control extensions. hapi runs extensions in registration order; do not add `before:`/`after:` options here (crumb's group name is `@hapi/crumb`, and root-level extensions cannot be targeted).

Unknown URLs are served by an explicit `GET /{any*}` route (`src/server/not-found/index.js`) rather than hapi's internal not-found handler, which skips cookie parsing, session, CSRF and the cookie-banner logic. The route uses `auth: { mode: 'try' }` so a signed-in user sees the signed-in page chrome, and disables the cookie scheme's `redirectTo` because that function runs before the auth mode is checked and would otherwise record the unknown URL as the post-sign-in destination.

Because unknown URLs now run the normal lifecycle, each cookieless 404 creates a server-side session entry (the cookie-policy extension reads the yar flash on every request, which marks the session modified) and issues session and CSRF cookies, exactly as any other page does for a first-time visitor. This is an accepted cost: bursts of 404s from scanners create short-lived cache entries. Two consequences worth knowing: Entra ID (internal) users see the signed-out 404 page, because the session strategy only accepts Entra sessions on Entra routes, matching every other non-Entra route; and a throw inside a later `onPreResponse` extension is no longer converted to an HTML error page, because `catchAll` has already run (those extensions are small and do not throw in practice).

## Configuration

| Variable                 | Where                             | Notes                                                                                                                |
| ------------------------ | --------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| `GOOGLE_TAG_MANAGER_KEY` | CDP portal Secret; `.env` locally | `GTM-XXXXXXX`. An invalid value is warned about at startup and treated as empty. Missing in `prod` warns at startup. |
| `CLARITY_PROJECT_ID`     | CDP portal Secret; `.env` locally | Missing in `prod`/`perf-test` warns at startup.                                                                      |

Neither value lives in any repository. Non-production and production containers are separate; the analytics team keeps them in sync, and this team verifies on test only.

## Handover to the performance analyst

- Web data stream URLs: non-prod `https://marine-licensing-frontend.test.cdp-int.defra.cloud`; prod `https://get-permission-for-marine-work.defra.gov.uk`.
- Unwanted referrals per stream: non-prod `your-account.cpdev.cui.defra.gov.uk`, `dcidmtest.b2clogin.com`, `login.microsoftonline.com`; prod `your-account.defra.gov.uk`, `dcidm.b2clogin.com`, `login.microsoftonline.com`. Do not exclude `marinemanagement.org.uk`.
- Query parameters to consider redacting: `ACTIVITY_TYPE`, `ARTICLE`, `pdfDownloadUrl`.
- Validation re-renders prefix the page title with `Error: `.
- Seven wait pages reload every two seconds while processing; each reload is a page_view.
