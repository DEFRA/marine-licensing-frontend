import {
  transformProjectDetailsTaskList,
  transformSiteDetailsTaskList
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
          href: marineLicenceRoutes.MARINE_LICENCE_SITE_DETAILS,
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
          href: marineLicenceRoutes.MARINE_LICENCE_SITE_DETAILS,
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
})
