import {
  getExemptionCache,
  setExemptionCache
} from '~/src/server/common/helpers/session-cache/utils.js'
import { config } from '~/src/config/config.js'

import Wreck from '@hapi/wreck'

export const PUBLIC_REGISTER_ROUTE = '/exemption/public-register'
export const PUBLIC_REGISTER_VIEW_ROUTE = 'exemption/public-register/index'

const publicRegisterSettings = {
  pageTitle: 'Public register',
  heading: 'Public register'
}

/**
 * A GDS styled public register page controller.
 * @satisfies {Partial<ServerRoute>}
 */
export const publicRegisterController = {
  handler(request, h) {
    const exemption = getExemptionCache(request)

    return h.view(PUBLIC_REGISTER_VIEW_ROUTE, {
      ...publicRegisterSettings,
      payload: {
        projectName: exemption.projectName,
        ...exemption.publicRegister
      }
    })
  }
}

/**
 * A GDS styled public register page controller.
 * @satisfies {Partial<ServerRoute>}
 */
export const publicRegisterSubmitController = {
  async handler(request, h) {
    const { payload } = request
    try {
      const exemption = getExemptionCache(request)

      const isAnswerYes = payload.consent === 'yes'

      await Wreck.patch(
        `${config.get('backend').apiUrl}/exemption/public-register`,
        {
          payload: {
            consent: !!isAnswerYes,
            ...(isAnswerYes && { reason: payload.reason }),
            id: exemption.id
          },
          json: true
        }
      )

      setExemptionCache(request, {
        ...exemption,
        publicRegister: {
          consent: payload.consent,
          reason: payload.reason
        }
      })

      return h.redirect('/exemption/task-list')
    } catch (e) {
      return h.view(PUBLIC_REGISTER_VIEW_ROUTE, {
        ...publicRegisterSettings,
        payload
      })
    }
  }
}
