import Boom from '@hapi/boom'
import joi from 'joi'
import {
  mapErrorsForDisplay,
  errorDescriptionByFieldName
} from '~/src/server/common/helpers/errors.js'
import {
  storeReferrer,
  getBackUrl,
  clearStoredReferrer
} from '~/src/server/common/helpers/referrer-validation.js'
import { getCookiePreferences } from '~/src/server/common/helpers/cookie-preferences.js'

const COOKIES_VIEW_ROUTE = 'help/cookies/index'

const cookiesPageSettings = {
  pageTitle: 'Cookies on Get permission for marine work'
}

const EXCLUDED_REFERRER_PATHS = ['/help/cookies']

/**
 * Cookies page GET controller
 * @satisfies {Partial<ServerRoute>}
 */
export const cookiesController = {
  options: {
    auth: {
      strategy: 'session',
      mode: 'try'
    }
  },
  handler(request, h) {
    const preferences = getCookiePreferences(request)
    const referer = request.headers.referer
    const showSuccessBanner = request.query.success === 'true'

    if (referer && !referer.includes('/help/cookies')) {
      storeReferrer(request, referer, EXCLUDED_REFERRER_PATHS)
    }

    const backUrl = getBackUrl(request, '/', EXCLUDED_REFERRER_PATHS)

    if (showSuccessBanner) {
      clearStoredReferrer(request)
    }

    return h.view(COOKIES_VIEW_ROUTE, {
      ...cookiesPageSettings,
      backUrl,
      payload: {
        analytics: preferences.analytics ? 'yes' : 'no'
      },
      showSuccessBanner,
      isAuthenticated: request.auth.isAuthenticated
    })
  }
}

/**
 * Cookies page POST controller
 * @satisfies {Partial<ServerRoute>}
 */
export const cookiesSubmitController = {
  options: {
    auth: {
      strategy: 'session',
      mode: 'try'
    },
    validate: {
      payload: joi.object({
        csrfToken: joi.string().allow(''),
        analytics: joi.string().valid('yes', 'no').required().messages({
          'any.only': 'ANALYTICS_CHOICE_REQUIRED',
          'string.empty': 'ANALYTICS_CHOICE_REQUIRED',
          'any.required': 'ANALYTICS_CHOICE_REQUIRED'
        })
      }),
      failAction: (request, h, err) => {
        const { payload } = request

        // Get back URL from session with fallback to '/'
        const backUrl = getBackUrl(request, '/', EXCLUDED_REFERRER_PATHS)

        if (!err.details) {
          return h
            .view(COOKIES_VIEW_ROUTE, {
              ...cookiesPageSettings,
              backUrl,
              payload,
              isAuthenticated: request.auth.isAuthenticated
            })
            .takeover()
        }

        const errorSummary = mapErrorsForDisplay(err.details, {
          ANALYTICS_CHOICE_REQUIRED:
            'Select yes if you want to accept analytics cookies'
        })

        const errors = errorDescriptionByFieldName(errorSummary)

        return h
          .view(COOKIES_VIEW_ROUTE, {
            ...cookiesPageSettings,
            backUrl,
            payload,
            errors,
            errorSummary,
            isAuthenticated: request.auth.isAuthenticated
          })
          .takeover()
      }
    }
  },
  handler(request, h) {
    const { payload } = request
    const analytics = payload.analytics === 'yes'

    try {
      const timestamp = Math.floor(Date.now() / 1000)

      const cookiesPolicy = {
        essential: true,
        analytics,
        timestamp
      }

      const response = h.redirect('/help/cookies?success=true')

      // Cookie options: 1 year expiry, site-wide path, secure in production
      const cookieOptions = {
        ttl: 365 * 24 * 60 * 60 * 1000, // 1 year in milliseconds
        path: '/',
        isSecure: process.env.NODE_ENV === 'production',
        isSameSite: 'Strict'
      }

      // Strictly speaking Whitespace, commas and semi-colons are not actually allowed in cookie values, so JSON is
      // not allowed.  Invalid cookie data causes Defra ID stub to break.
      const cookieOptionsB64 = {
        ...cookieOptions,
        encoding: 'base64json'
      }
      response.state('cookies_policy', cookiesPolicy, cookieOptionsB64)
      response.state('cookies_preferences_set', 'true', cookieOptions)
      return response
    } catch (error) {
      request.logger.error(error, 'Error saving cookie preferences')
      throw Boom.internal('Error saving cookie preferences')
    }
  }
}
