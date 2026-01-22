import { paramsSchema } from './schema.js'
import { mcmsAnswersDownloadUrl } from '~/src/server/test-helpers/mocks/mcms.js'

describe('mcms-context schema', () => {
  describe('paramsSchema validation and transformation', () => {
    const validBaseParams = {
      ACTIVITY_TYPE: 'CON',
      ARTICLE: '17',
      pdfDownloadUrl: mcmsAnswersDownloadUrl
    }

    describe('validation', () => {
      it('should validate valid params', () => {
        const params = {
          ...validBaseParams
        }

        const { error } = paramsSchema.validate(params)
        expect(error).toBeUndefined()
      })

      it('should validate params and ignore unknown fields', () => {
        const params = {
          ...validBaseParams,
          EXE_ACTIVITY_SUBTYPE_CONSTRUCTION: 'maintenance',
          extraField: 'ignored'
        }

        const { error } = paramsSchema.validate(params)
        expect(error).toBeUndefined()
      })

      it('should reject invalid ACTIVITY_TYPE', () => {
        const params = {
          ...validBaseParams,
          ACTIVITY_TYPE: 'INVALID'
        }

        const { error } = paramsSchema.validate(params)
        expect(error).toBeDefined()
        expect(error.details[0].path).toEqual(['ACTIVITY_TYPE'])
      })

      it('should reject invalid ARTICLE', () => {
        const params = {
          ...validBaseParams,
          ARTICLE: '99'
        }

        const { error } = paramsSchema.validate(params)
        expect(error).toBeDefined()
        expect(error.details[0].path).toEqual(['ARTICLE'])
      })

      it('should validate pdfDownloadUrl matching the required pattern', () => {
        const validUrls = [
          'https://marinelicensing.marinemanagement.org.uk/path/journey/self-service/outcome-document/b87ae3f7-48f3-470d-b29b-5a5abfdaa49f',
          'https://marinelicensingtest.marinemanagement.org.uk/somepath/journey/self-service/outcome-document/a1b2c3d4-e5f6-7890-abcd-ef1234567890'
        ]

        validUrls.forEach((url) => {
          const params = {
            ...validBaseParams,
            pdfDownloadUrl: url,
            ACTIVITY_TYPE: 'INCINERATION'
          }

          const { error } = paramsSchema.validate(params)
          expect(error).toBeUndefined()
        })
      })

      it('should reject pdfDownloadUrl not matching the required pattern', () => {
        const invalidUrls = [
          'https://example.com/test.pdf',
          'http://marinelicensing.marinemanagement.org.uk/path/journey/self-service/outcome-document/b87ae3f7-48f3-470d-b29b-5a5abfdaa49f',
          'https://marinemanagement.org.uk/path/journey/self-service/outcome-document/b87ae3f7-48f3-470d-b29b-5a5abfdaa49f',
          'https://marinelicensing.marinemanagement.org.uk/journey/self-service/outcome-document/b87ae3f7-48f3-470d-b29b-5a5abfdaa49f',
          'https://marinelicensing.marinemanagement.org.uk/path/journey/outcome-document/b87ae3f7-48f3-470d-b29b-5a5abfdaa49f',
          'https://marinelicensing.marinemanagement.co.uk/path/journey/self-service/outcome-document/b87ae3f7-48f3-470d-b29b-5a5abfdaa49f',
          'https://marinelicensing.marinemanagement.org.uk/path/journey/self-service/other/b87ae3f7-48f3-470d-b29b-5a5abfdaa49f',
          'https://marinelicensing.marinemanagement.org.uk/path/journey/self-service/outcome-document/invalid/path',
          'https://marinelicensing.marinemanagement.org.uk/path/journey/self-service/outcome-document/has spaces',
          'https://marinelicensing.marinemanagement.org.uk/path/journey/self-service/outcome-document/invalid@char'
        ]

        invalidUrls.forEach((url) => {
          const params = {
            ...validBaseParams,
            pdfDownloadUrl: url,
            ACTIVITY_TYPE: 'INCINERATION'
          }

          const { error } = paramsSchema.validate(params)
          expect(error).toBeDefined()
          expect(error.details[0].path).toEqual(['pdfDownloadUrl'])
        })
      })

      it('should require pdfDownloadUrl', () => {
        const params = {
          ACTIVITY_TYPE: 'INCINERATION',
          ARTICLE: '17'
        }

        const { error } = paramsSchema.validate(params)
        expect(error).toBeDefined()
        expect(error.details[0].path).toEqual(['pdfDownloadUrl'])
      })
    })

    describe('transformation', () => {
      it('should transform valid params and ignore extra fields', () => {
        const params = {
          ...validBaseParams,
          EXE_ACTIVITY_SUBTYPE_CONSTRUCTION: 'maintenance',
          extraParam: 'ignored'
        }

        const { error, value } = paramsSchema.validate(params)
        expect(error).toBeUndefined()
        expect(value).toEqual({
          activityType: 'CON',
          article: '17',
          pdfDownloadUrl:
            'https://marinelicensing.marinemanagement.org.uk/path/journey/self-service/outcome-document/b87ae3f7-48f3-470d-b29b-5a5abfdaa49f'
        })
      })

      it('should transform valid params for all activity types', () => {
        const params = {
          ...validBaseParams,
          ACTIVITY_TYPE: 'INCINERATION'
        }

        const { error, value } = paramsSchema.validate(params)
        expect(error).toBeUndefined()
        expect(value).toEqual({
          activityType: 'INCINERATION',
          article: '17',
          pdfDownloadUrl:
            'https://marinelicensing.marinemanagement.org.uk/path/journey/self-service/outcome-document/b87ae3f7-48f3-470d-b29b-5a5abfdaa49f'
        })
      })

      it('should transform params with all valid article codes', () => {
        const articleCodes = [
          '13',
          '17',
          '17A',
          '17B',
          '18A',
          '20',
          '21',
          '25',
          '25A',
          '26A',
          '34',
          '35'
        ]

        articleCodes.forEach((article) => {
          const params = {
            ...validBaseParams,
            ARTICLE: article,
            ACTIVITY_TYPE: 'INCINERATION'
          }

          const { error, value } = paramsSchema.validate(params)
          expect(error).toBeUndefined()
          expect(value.article).toBe(article)
        })
      })

      it('should transform params with all valid activity types', () => {
        const activityTypes = [
          'CON',
          'DEPOSIT',
          'REMOVAL',
          'DREDGE',
          'INCINERATION',
          'EXPLOSIVES',
          'SCUTTLING'
        ]

        activityTypes.forEach((activityType) => {
          const params = {
            ...validBaseParams,
            ACTIVITY_TYPE: activityType
          }

          const { error, value } = paramsSchema.validate(params)
          expect(error).toBeUndefined()
          expect(value.activityType).toBe(activityType)
        })
      })
    })
  })
})
