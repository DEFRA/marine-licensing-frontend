import {
  transformProjectDetailsTaskList,
  transformSiteDetailsTaskList,
  transformOtherPermissionsTaskList,
  transformSharingTaskList
} from '#src/server/marine-licence/task-list/utils.js'
import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'

describe('taskList utils', () => {
  describe('transformProjectDetailsTaskList', () => {
    test('correctly returns Completed status', () => {
      expect(
        transformProjectDetailsTaskList({ projectName: 'COMPLETED' })
      ).toEqual([
        {
          href: marineLicenceRoutes.MARINE_LICENCE_PROJECT_NAME,
          status: { text: 'Completed' },
          title: {
            classes: 'govuk-link--no-visited-state',
            text: 'Project name'
          }
        }
      ])
    })

    test('correctly returns In Progress', () => {
      expect(
        transformProjectDetailsTaskList({ projectName: 'IN_PROGRESS' })
      ).toEqual([
        {
          href: marineLicenceRoutes.MARINE_LICENCE_PROJECT_NAME,
          status: {
            tag: { text: 'In Progress', classes: 'govuk-tag--light-blue' }
          },
          title: {
            classes: 'govuk-link--no-visited-state',
            text: 'Project name'
          }
        }
      ])
    })

    test.each([null, 'INCOMPLETE', undefined])(
      'correctly returns Not yet started for %s',
      (value) => {
        expect(transformProjectDetailsTaskList({ projectName: value })).toEqual(
          [
            {
              href: marineLicenceRoutes.MARINE_LICENCE_PROJECT_NAME,
              status: {
                tag: { text: 'Not yet started', classes: 'govuk-tag--blue' }
              },
              title: {
                classes: 'govuk-link--no-visited-state',
                text: 'Project name'
              }
            }
          ]
        )
      }
    )
  })

  describe('transformSiteDetailsTaskList', () => {
    test('correctly returns Completed status', () => {
      expect(
        transformSiteDetailsTaskList({ siteDetails: 'COMPLETED' })
      ).toEqual([
        {
          href: marineLicenceRoutes.MARINE_LICENCE_REVIEW_SITE_DETAILS,
          status: { text: 'Completed' },
          title: {
            classes: 'govuk-link--no-visited-state',
            text: 'Site details'
          }
        }
      ])
    })

    test('correctly returns In Progress', () => {
      expect(
        transformSiteDetailsTaskList({ siteDetails: 'IN_PROGRESS' })
      ).toEqual([
        {
          href: marineLicenceRoutes.MARINE_LICENCE_REVIEW_SITE_DETAILS,
          status: {
            tag: { text: 'In Progress', classes: 'govuk-tag--light-blue' }
          },
          title: {
            classes: 'govuk-link--no-visited-state',
            text: 'Site details'
          }
        }
      ])
    })

    test.each([null, 'INCOMPLETE', undefined])(
      'correctly returns Not yet started for %s',
      (value) => {
        expect(transformSiteDetailsTaskList({ siteDetails: value })).toEqual([
          {
            href: marineLicenceRoutes.MARINE_LICENCE_SITE_DETAILS,
            status: {
              tag: { text: 'Not yet started', classes: 'govuk-tag--blue' }
            },
            title: {
              classes: 'govuk-link--no-visited-state',
              text: 'Site details'
            }
          }
        ])
      }
    )
  })

  describe('transformOtherPermissionsTaskList', () => {
    test('correctly returns Completed status', () => {
      expect(
        transformOtherPermissionsTaskList({
          specialLegalPowers: 'COMPLETED',
          otherAuthorities: 'COMPLETED'
        })
      ).toEqual([
        {
          href: marineLicenceRoutes.MARINE_LICENCE_SPECIAL_LEGAL_POWERS,
          status: { text: 'Completed' },
          title: {
            classes: 'govuk-link--no-visited-state',
            text: 'Special legal powers'
          }
        },
        {
          href: marineLicenceRoutes.MARINE_LICENCE_OTHER_AUTHORITIES,
          status: { text: 'Completed' },
          title: {
            classes: 'govuk-link--no-visited-state',
            text: 'Other authorities'
          }
        }
      ])
    })

    test('correctly returns In Progress', () => {
      expect(
        transformOtherPermissionsTaskList({
          specialLegalPowers: 'IN_PROGRESS',
          otherAuthorities: 'IN_PROGRESS'
        })
      ).toEqual([
        {
          href: marineLicenceRoutes.MARINE_LICENCE_SPECIAL_LEGAL_POWERS,
          status: {
            tag: { text: 'In Progress', classes: 'govuk-tag--light-blue' }
          },
          title: {
            classes: 'govuk-link--no-visited-state',
            text: 'Special legal powers'
          }
        },
        {
          href: marineLicenceRoutes.MARINE_LICENCE_OTHER_AUTHORITIES,
          status: {
            tag: { text: 'In Progress', classes: 'govuk-tag--light-blue' }
          },
          title: {
            classes: 'govuk-link--no-visited-state',
            text: 'Other authorities'
          }
        }
      ])
    })

    test.each([null, 'INCOMPLETE', undefined])(
      'correctly returns Not yet started for %s',
      (value) => {
        expect(
          transformOtherPermissionsTaskList({
            specialLegalPowers: value,
            otherAuthorities: value
          })
        ).toEqual([
          {
            href: marineLicenceRoutes.MARINE_LICENCE_SPECIAL_LEGAL_POWERS,
            status: {
              tag: { text: 'Not yet started', classes: 'govuk-tag--blue' }
            },
            title: {
              classes: 'govuk-link--no-visited-state',
              text: 'Special legal powers'
            }
          },
          {
            href: marineLicenceRoutes.MARINE_LICENCE_OTHER_AUTHORITIES,
            status: {
              tag: { text: 'Not yet started', classes: 'govuk-tag--blue' }
            },
            title: {
              classes: 'govuk-link--no-visited-state',
              text: 'Other authorities'
            }
          }
        ])
      }
    )

    describe('when isCitizen is true', () => {
      test('correctly returns Completed status', () => {
        expect(
          transformOtherPermissionsTaskList(
            { otherAuthorities: 'COMPLETED' },
            true
          )
        ).toEqual([
          {
            href: marineLicenceRoutes.MARINE_LICENCE_OTHER_AUTHORITIES,
            status: { text: 'Completed' },
            title: {
              classes: 'govuk-link--no-visited-state',
              text: 'Other authorities'
            }
          }
        ])
      })

      test('correctly returns In Progress', () => {
        expect(
          transformOtherPermissionsTaskList(
            { otherAuthorities: 'IN_PROGRESS' },
            true
          )
        ).toEqual([
          {
            href: marineLicenceRoutes.MARINE_LICENCE_OTHER_AUTHORITIES,
            status: {
              tag: { text: 'In Progress', classes: 'govuk-tag--light-blue' }
            },
            title: {
              classes: 'govuk-link--no-visited-state',
              text: 'Other authorities'
            }
          }
        ])
      })

      test.each([null, 'INCOMPLETE', undefined])(
        'correctly returns Not yet started for %s',
        (value) => {
          expect(
            transformOtherPermissionsTaskList({ otherAuthorities: value }, true)
          ).toEqual([
            {
              href: marineLicenceRoutes.MARINE_LICENCE_OTHER_AUTHORITIES,
              status: {
                tag: { text: 'Not yet started', classes: 'govuk-tag--blue' }
              },
              title: {
                classes: 'govuk-link--no-visited-state',
                text: 'Other authorities'
              }
            }
          ])
        }
      )
    })
  })

  describe('transformSharingTaskList', () => {
    test('correctly returns Completed status', () => {
      expect(
        transformSharingTaskList({
          publicRegister: 'COMPLETED'
        })
      ).toEqual([
        {
          href: marineLicenceRoutes.MARINE_LICENCE_PUBLIC_REGISTER,
          status: { text: 'Completed' },
          title: {
            classes: 'govuk-link--no-visited-state',
            text: 'Sharing your project information publicly'
          }
        }
      ])
    })

    test('correctly returns In Progress', () => {
      expect(
        transformSharingTaskList({
          publicRegister: 'IN_PROGRESS'
        })
      ).toEqual([
        {
          href: marineLicenceRoutes.MARINE_LICENCE_PUBLIC_REGISTER,
          status: {
            tag: { text: 'In Progress', classes: 'govuk-tag--light-blue' }
          },
          title: {
            classes: 'govuk-link--no-visited-state',
            text: 'Sharing your project information publicly'
          }
        }
      ])
    })

    test.each([null, 'INCOMPLETE', undefined])(
      'correctly returns Not yet started for %s',
      (value) => {
        expect(
          transformSharingTaskList({
            publicRegister: value
          })
        ).toEqual([
          {
            href: marineLicenceRoutes.MARINE_LICENCE_PUBLIC_REGISTER,
            status: {
              tag: { text: 'Not yet started', classes: 'govuk-tag--blue' }
            },
            title: {
              classes: 'govuk-link--no-visited-state',
              text: 'Sharing your project information publicly'
            }
          }
        ])
      }
    )
  })
})
