/**
 * @param {Request} request
 * @param {ResponseToolkit} h
 */
export function setPageCacheControlHeaders(request, h) {
  const { response } = request

  if ('isBoom' in response) {
    return h.continue
  }

  const path = request.path
  const isStaticAsset =
    /\.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot|map)$/i.test(path)

  if (isStaticAsset) {
    return h.continue
  }

  response.header('Cache-Control', 'no-cache, no-store, must-revalidate')
  response.header('Pragma', 'no-cache')
  response.header('Expires', '0')

  return h.continue
}

/**
 * @import { Request, ResponseToolkit } from '@hapi/hapi'
 */
