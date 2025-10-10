import { paramsSchema } from './schema.js'
import { mcmsAnswersDownloadUrl } from '~/src/server/test-helpers/mocks.js'

describe('mcms-context schema', () => {
  describe('paramsSchema validation and transformation', () => {
    const validBaseParams = {
      ACTIVITY_TYPE: 'CON',
      ARTICLE: '17',
      pdfDownloadUrl: mcmsAnswersDownloadUrl
    }

    describe('validation', () => {
      it('should validate valid params with construction subtype', () => {
        const params = {
          ...validBaseParams,
          EXE_ACTIVITY_SUBTYPE_CONSTRUCTION: 'maintenance'
        }

        const { error } = paramsSchema.validate(params)
        expect(error).toBeUndefined()
      })

      it('should validate valid params with deposit subtype', () => {
        const params = {
          ...validBaseParams,
          ACTIVITY_TYPE: 'DEPOSIT',
          EXE_ACTIVITY_SUBTYPE_DEPOSIT: 'dredgedMaterial'
        }

        const { error } = paramsSchema.validate(params)
        expect(error).toBeUndefined()
      })

      it('should validate valid params with removal subtype', () => {
        const params = {
          ...validBaseParams,
          ACTIVITY_TYPE: 'REMOVAL',
          EXE_ACTIVITY_SUBTYPE_REMOVAL: 'emergency'
        }

        const { error } = paramsSchema.validate(params)
        expect(error).toBeUndefined()
      })

      it('should validate valid params with dredging subtype', () => {
        const params = {
          ...validBaseParams,
          ACTIVITY_TYPE: 'DREDGE',
          EXE_ACTIVITY_SUBTYPE_DREDGING: 'navigationalDredging'
        }

        const { error } = paramsSchema.validate(params)
        expect(error).toBeUndefined()
      })

      it('should validate params without subtype for non-requiring activity types', () => {
        const params = {
          ...validBaseParams,
          ACTIVITY_TYPE: 'INCINERATION'
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

      it('should require EXE_ACTIVITY_SUBTYPE_CONSTRUCTION when ACTIVITY_TYPE is CON', () => {
        const params = {
          ...validBaseParams,
          ACTIVITY_TYPE: 'CON'
        }

        const { error } = paramsSchema.validate(params)
        expect(error).toBeDefined()
        expect(error.details[0].path).toEqual([
          'EXE_ACTIVITY_SUBTYPE_CONSTRUCTION'
        ])
      })

      it('should reject EXE_ACTIVITY_SUBTYPE_CONSTRUCTION when ACTIVITY_TYPE is not CON', () => {
        const params = {
          ...validBaseParams,
          ACTIVITY_TYPE: 'DEPOSIT',
          EXE_ACTIVITY_SUBTYPE_CONSTRUCTION: 'maintenance'
        }

        const { error } = paramsSchema.validate(params)
        expect(error).toBeDefined()
        expect(error.details[0].path).toEqual([
          'EXE_ACTIVITY_SUBTYPE_CONSTRUCTION'
        ])
      })

      it('should reject invalid activity subtype value', () => {
        const params = {
          ...validBaseParams,
          ACTIVITY_TYPE: 'CON',
          EXE_ACTIVITY_SUBTYPE_CONSTRUCTION: 'invalidSubtype'
        }

        const { error } = paramsSchema.validate(params)
        expect(error).toBeDefined()
        expect(error.details[0].path).toEqual([
          'EXE_ACTIVITY_SUBTYPE_CONSTRUCTION'
        ])
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
      it('should transform valid params with construction subtype', () => {
        const params = {
          ...validBaseParams,
          EXE_ACTIVITY_SUBTYPE_CONSTRUCTION: 'maintenance',
          extraParam: 'ignored'
        }

        const { error, value } = paramsSchema.validate(params)
        expect(error).toBeUndefined()
        expect(value).toEqual({
          activityType: 'CON',
          activitySubtype: 'maintenance',
          article: '17',
          pdfDownloadUrl:
            'https://marinelicensing.marinemanagement.org.uk/path/journey/self-service/outcome-document/b87ae3f7-48f3-470d-b29b-5a5abfdaa49f'
        })
      })

      it('should transform valid params with deposit subtype', () => {
        const params = {
          ...validBaseParams,
          ACTIVITY_TYPE: 'DEPOSIT',
          EXE_ACTIVITY_SUBTYPE_DEPOSIT: 'dredgedMaterial'
        }

        const { error, value } = paramsSchema.validate(params)
        expect(error).toBeUndefined()
        expect(value).toEqual({
          activityType: 'DEPOSIT',
          activitySubtype: 'dredgedMaterial',
          article: '17',
          pdfDownloadUrl:
            'https://marinelicensing.marinemanagement.org.uk/path/journey/self-service/outcome-document/b87ae3f7-48f3-470d-b29b-5a5abfdaa49f'
        })
      })

      it('should transform valid params with null subtype for non-requiring activity types', () => {
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

          // Add required subtype for specific activity types
          if (activityType === 'CON') {
            params.EXE_ACTIVITY_SUBTYPE_CONSTRUCTION = 'maintenance'
          } else if (activityType === 'DEPOSIT') {
            params.EXE_ACTIVITY_SUBTYPE_DEPOSIT = 'dredgedMaterial'
          } else if (activityType === 'REMOVAL') {
            params.EXE_ACTIVITY_SUBTYPE_REMOVAL = 'emergency'
          } else if (activityType === 'DREDGE') {
            params.EXE_ACTIVITY_SUBTYPE_DREDGING = 'navigationalDredging'
          }

          const { error, value } = paramsSchema.validate(params)
          expect(error).toBeUndefined()
          expect(value.activityType).toBe(activityType)
        })
      })
    })
  })
})
