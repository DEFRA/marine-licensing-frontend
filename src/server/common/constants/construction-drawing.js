export const CONSTRUCTION_DRAWING_ACCEPT_ATTRIBUTE =
  '.pdf,.bmp,.gif,.jpg,.jpeg,.png,.tif'

export const CONSTRUCTION_DRAWING_S3_PATH =
  'marine-licence/construction-drawings'

// Checked against CDP's detectedContentType, which is read from the file's actual bytes.
// The accept attribute above only filters the file picker dialog and the extension check
// only sees the filename, so this is the one gate a renamed file cannot walk through.
// Keep in step with the extension list above. The x- forms are included because content
// detection still reports them for BMP and TIFF on some platforms.
export const CONSTRUCTION_DRAWING_ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/bmp',
  'image/x-ms-bmp',
  'image/gif',
  'image/jpeg',
  'image/png',
  'image/tiff',
  'image/x-tiff'
]
