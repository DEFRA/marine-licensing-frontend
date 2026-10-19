import QRCode from 'qrcode'
import { config } from '#src/config/config.js'
import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'

export const SITE_NOTICE_QR_CODE_DEFAULT_SIZE = 200
const ERROR_CORRECTION_LEVEL = 'Q'
const QUIET_ZONE_MODULES = 4

const trimTrailingSlashes = (path) => {
  let end = path.length
  while (end > 0 && path[end - 1] === '/') {
    end--
  }
  return path.slice(0, end)
}

export const getPublicViewDetailsAbsoluteUrl = (
  marineLicenceId,
  baseUrl = config.get('appBaseUrl')
) => {
  const base = new URL(baseUrl)
  const basePath = trimTrailingSlashes(base.pathname)
  return new URL(
    `${basePath}${marineLicenceRoutes.MARINE_LICENCE_VIEW_DETAILS_PUBLIC}/${encodeURIComponent(marineLicenceId)}`,
    base.origin
  ).href
}

export const createQrCodeSvg = (
  text,
  size = SITE_NOTICE_QR_CODE_DEFAULT_SIZE
) =>
  QRCode.toString(text, {
    type: 'svg',
    errorCorrectionLevel: ERROR_CORRECTION_LEVEL,
    margin: QUIET_ZONE_MODULES,
    width: size
  })

export const getSiteNoticeQrCode = async (marineLicenceId) => {
  const url = getPublicViewDetailsAbsoluteUrl(marineLicenceId)
  return { url, svg: await createQrCodeSvg(url) }
}
