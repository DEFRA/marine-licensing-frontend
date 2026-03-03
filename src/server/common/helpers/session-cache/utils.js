import { PROJECT_TYPE_CACHE_KEY } from '#src/server/common/constants/cache.js'

export const getProjectType = (request) =>
  request.yar.get(PROJECT_TYPE_CACHE_KEY)

export const setProjectType = async (request, h, type) => {
  request.yar.set(PROJECT_TYPE_CACHE_KEY, type)
  await request.yar.commit(h)
}
