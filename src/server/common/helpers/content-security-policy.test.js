import { contentSecurityPolicy } from './content-security-policy.js'

describe('contentSecurityPolicy', () => {
  it('should export a Hapi plugin configuration with correct CSP options', () => {
    expect(contentSecurityPolicy).toEqual(
      expect.objectContaining({
        options: {
          defaultSrc: 'self',
          fontSrc: ['self', 'data:'],
          connectSrc: ['self', 'data:'],
          mediaSrc: 'self',
          styleSrc: ['self'],
          scriptSrc: [
            'self',
            "'sha256-GUQ5ad8JK5KmEWmROf3LZd9ge94daqNvd8xy9YS1iDw='"
          ],
          imgSrc: ['self', 'data:', 'https://tile.openstreetmap.org'],
          frameSrc: 'self',
          objectSrc: 'none',
          frameAncestors: 'none',
          formAction: 'self',
          manifestSrc: 'self',
          generateNonces: false
        }
      })
    )
  })
})
