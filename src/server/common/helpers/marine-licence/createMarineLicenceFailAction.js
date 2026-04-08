import { createFailAction } from '#src/server/common/helpers/createFailAction.js'
import { getMarineLicenceCache } from '#src/server/common/helpers/marine-licence/session-cache/utils.js'

export const createMarineLicenceFailAction = (opts) =>
  createFailAction({ ...opts, getCache: getMarineLicenceCache })
