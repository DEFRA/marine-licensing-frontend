import {
  transformProjectDetailsTaskList,
  transformSiteDetailsTaskList,
  transformOtherPermissionsTaskList,
  transformSharingTaskList,
  transformWaterFrameworkDirectiveTaskList,
  transformMarinePlanPoliciesTaskList
} from '#src/server/marine-licence/task-list/utils.js'
import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'

describe('taskList utils', () => {
  describe('transformProjectDetailsTaskList', () => {
    test('correctly returns Completed status', () => {
      expect(
        transformProjectDetailsTaskList({
          projectName: 'COMPLETED',
          projectBackground: 'COMPLETED',
          preferredDates: 'COMPLETED'
        })
      ).toEqual([
        {
          href: marineLicenceRoutes.MARINE_LICENCE_PROJECT_NAME,
          status: { text: 'Completed' },
          title: {
            classes: 'govuk-link--no-visited-state',
            text: 'Project name'
          }
        },
        {
          href: marineLicenceRoutes.MARINE_LICENCE_PROJECT_BACKGROUND,
          status: { text: 'Completed' },
          title: {
            classes: 'govuk-link--no-visited-state',
            text: 'Project background'
          }
        },
        {
          href: marineLicenceRoutes.MARINE_LICENCE_PREFERRED_DATES,
          status: { text: 'Completed' },
          title: {
            classes: 'govuk-link--no-visited-state',
            text: 'Preferred start and end dates of the licence'
          }
        }
      ])
    })

    test('correctly returns In progress', () => {
      expect(
        transformProjectDetailsTaskList({
          projectName: 'IN_PROGRESS',
          projectBackground: 'IN_PROGRESS',
          preferredDates: 'IN_PROGRESS'
        })
      ).toEqual([
        {
          href: marineLicenceRoutes.MARINE_LICENCE_PROJECT_NAME,
          status: {
            tag: { text: 'In progress', classes: 'govuk-tag--teal' }
          },
          title: {
            classes: 'govuk-link--no-visited-state',
            text: 'Project name'
          }
        },
        {
          href: marineLicenceRoutes.MARINE_LICENCE_PROJECT_BACKGROUND,
          status: {
            tag: { text: 'In progress', classes: 'govuk-tag--teal' }
          },
          title: {
            classes: 'govuk-link--no-visited-state',
            text: 'Project background'
          }
        },
        {
          href: marineLicenceRoutes.MARINE_LICENCE_PREFERRED_DATES,
          status: {
            tag: { text: 'In progress', classes: 'govuk-tag--teal' }
          },
          title: {
            classes: 'govuk-link--no-visited-state',
            text: 'Preferred start and end dates of the licence'
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
            },
            {
              href: marineLicenceRoutes.MARINE_LICENCE_PROJECT_BACKGROUND,
              status: {
                tag: { text: 'Not yet started', classes: 'govuk-tag--blue' }
              },
              title: {
                classes: 'govuk-link--no-visited-state',
                text: 'Project background'
              }
            },
            {
              href: marineLicenceRoutes.MARINE_LICENCE_PREFERRED_DATES,
              status: {
                tag: { text: 'Not yet started', classes: 'govuk-tag--blue' }
              },
              title: {
                classes: 'govuk-link--no-visited-state',
                text: 'Preferred start and end dates of the licence'
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

    test('correctly returns In progress', () => {
      expect(
        transformSiteDetailsTaskList({ siteDetails: 'IN_PROGRESS' })
      ).toEqual([
        {
          href: marineLicenceRoutes.MARINE_LICENCE_REVIEW_SITE_DETAILS,
          status: {
            tag: { text: 'In progress', classes: 'govuk-tag--teal' }
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
          otherAuthorities: 'COMPLETED',
          publicConsultation: 'COMPLETED'
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
        },
        {
          href: marineLicenceRoutes.MARINE_LICENCE_PUBLIC_CONSULTATION,
          status: { text: 'Completed' },
          title: {
            classes: 'govuk-link--no-visited-state',
            text: 'Pre-application consultation'
          }
        }
      ])
    })

    test('correctly returns In progress', () => {
      expect(
        transformOtherPermissionsTaskList({
          specialLegalPowers: 'IN_PROGRESS',
          otherAuthorities: 'IN_PROGRESS',
          publicConsultation: 'IN_PROGRESS'
        })
      ).toEqual([
        {
          href: marineLicenceRoutes.MARINE_LICENCE_SPECIAL_LEGAL_POWERS,
          status: {
            tag: { text: 'In progress', classes: 'govuk-tag--teal' }
          },
          title: {
            classes: 'govuk-link--no-visited-state',
            text: 'Special legal powers'
          }
        },
        {
          href: marineLicenceRoutes.MARINE_LICENCE_OTHER_AUTHORITIES,
          status: {
            tag: { text: 'In progress', classes: 'govuk-tag--teal' }
          },
          title: {
            classes: 'govuk-link--no-visited-state',
            text: 'Other authorities'
          }
        },
        {
          href: marineLicenceRoutes.MARINE_LICENCE_PUBLIC_CONSULTATION,
          status: {
            tag: { text: 'In progress', classes: 'govuk-tag--teal' }
          },
          title: {
            classes: 'govuk-link--no-visited-state',
            text: 'Pre-application consultation'
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
            otherAuthorities: value,
            publicConsultation: value
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
          },
          {
            href: marineLicenceRoutes.MARINE_LICENCE_PUBLIC_CONSULTATION,
            status: {
              tag: { text: 'Not yet started', classes: 'govuk-tag--blue' }
            },
            title: {
              classes: 'govuk-link--no-visited-state',
              text: 'Pre-application consultation'
            }
          }
        ])
      }
    )

    describe('when isCitizen is true', () => {
      test('correctly returns Completed status', () => {
        expect(
          transformOtherPermissionsTaskList(
            { otherAuthorities: 'COMPLETED', publicConsultation: 'COMPLETED' },
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
          },
          {
            href: marineLicenceRoutes.MARINE_LICENCE_PUBLIC_CONSULTATION,
            status: { text: 'Completed' },
            title: {
              classes: 'govuk-link--no-visited-state',
              text: 'Pre-application consultation'
            }
          }
        ])
      })

      test('correctly returns In progress', () => {
        expect(
          transformOtherPermissionsTaskList(
            {
              otherAuthorities: 'IN_PROGRESS',
              publicConsultation: 'IN_PROGRESS'
            },
            true
          )
        ).toEqual([
          {
            href: marineLicenceRoutes.MARINE_LICENCE_OTHER_AUTHORITIES,
            status: {
              tag: { text: 'In progress', classes: 'govuk-tag--teal' }
            },
            title: {
              classes: 'govuk-link--no-visited-state',
              text: 'Other authorities'
            }
          },
          {
            href: marineLicenceRoutes.MARINE_LICENCE_PUBLIC_CONSULTATION,
            status: {
              tag: { text: 'In progress', classes: 'govuk-tag--teal' }
            },
            title: {
              classes: 'govuk-link--no-visited-state',
              text: 'Pre-application consultation'
            }
          }
        ])
      })

      test.each([null, 'INCOMPLETE', undefined])(
        'correctly returns Not yet started for %s',
        (value) => {
          expect(
            transformOtherPermissionsTaskList(
              { otherAuthorities: value, publicConsultation: value },
              true
            )
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
            },
            {
              href: marineLicenceRoutes.MARINE_LICENCE_PUBLIC_CONSULTATION,
              status: {
                tag: { text: 'Not yet started', classes: 'govuk-tag--blue' }
              },
              title: {
                classes: 'govuk-link--no-visited-state',
                text: 'Pre-application consultation'
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

    test('correctly returns In progress', () => {
      expect(
        transformSharingTaskList({
          publicRegister: 'IN_PROGRESS'
        })
      ).toEqual([
        {
          href: marineLicenceRoutes.MARINE_LICENCE_PUBLIC_REGISTER,
          status: {
            tag: { text: 'In progress', classes: 'govuk-tag--teal' }
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

  describe('transformMarinePlanPoliciesTaskList', () => {
    test('returns linked "Not yet started" row when sites completed and job ready', () => {
      expect(
        transformMarinePlanPoliciesTaskList(
          { siteDetails: 'COMPLETED' },
          { marinePlanPolicyJob: 'ready', marinePlanPoliciesCount: 44 }
        )
      ).toEqual([
        {
          title: {
            text: 'Marine plan policy considerations (44 to complete)',
            classes: 'govuk-link--no-visited-state'
          },
          href: marineLicenceRoutes.MARINE_LICENCE_MARINE_PLAN_POLICIES,
          status: {
            tag: { text: 'Not yet started', classes: 'govuk-tag--blue' }
          }
        }
      ])
    })

    test('uses marinePlanPoliciesCount for the count suffix', () => {
      const [task] = transformMarinePlanPoliciesTaskList(
        { siteDetails: 'COMPLETED' },
        { marinePlanPolicyJob: 'ready', marinePlanPoliciesCount: 7 }
      )

      expect(task.title.text).toBe(
        'Marine plan policy considerations (7 to complete)'
      )
    })

    test('Should return "Not yet started" with "N to complete" when no responses saved', () => {
      expect(
        transformMarinePlanPoliciesTaskList(
          { siteDetails: 'COMPLETED' },
          {
            marinePlanPolicyJob: 'ready',
            marinePlanPoliciesCount: 37,
            marinePlanPolicyResponseCount: 0
          }
        )
      ).toEqual([
        {
          title: {
            text: 'Marine plan policy considerations (37 to complete)',
            classes: 'govuk-link--no-visited-state'
          },
          href: marineLicenceRoutes.MARINE_LICENCE_TASK_LIST,
          status: {
            tag: { text: 'Not yet started', classes: 'govuk-tag--blue' }
          }
        }
      ])
    })

    test('Should return "In progress" with "N of M completed" when some responses saved', () => {
      expect(
        transformMarinePlanPoliciesTaskList(
          { siteDetails: 'COMPLETED' },
          {
            marinePlanPolicyJob: 'ready',
            marinePlanPoliciesCount: 37,
            marinePlanPolicyResponseCount: 8
          }
        )
      ).toEqual([
        {
          title: {
            text: 'Marine plan policy considerations (8 of 37 completed)',
            classes: 'govuk-link--no-visited-state'
          },
          href: marineLicenceRoutes.MARINE_LICENCE_TASK_LIST,
          status: {
            tag: { text: 'In progress', classes: 'govuk-tag--teal' }
          }
        }
      ])
    })

    test('Should return "Completed" with "N of N completed" when all responses saved', () => {
      expect(
        transformMarinePlanPoliciesTaskList(
          { siteDetails: 'COMPLETED' },
          {
            marinePlanPolicyJob: 'ready',
            marinePlanPoliciesCount: 37,
            marinePlanPolicyResponseCount: 37
          }
        )
      ).toEqual([
        {
          title: {
            text: 'Marine plan policy considerations (37 of 37 completed)',
            classes: 'govuk-link--no-visited-state'
          },
          href: marineLicenceRoutes.MARINE_LICENCE_TASK_LIST,
          status: { text: 'Completed' }
        }
      ])
    })

    test('omits the count suffix when count is not a number', () => {
      expect(
        transformMarinePlanPoliciesTaskList(
          { siteDetails: 'COMPLETED' },
          { marinePlanPolicyJob: 'ready', marinePlanPoliciesCount: undefined }
        )
      ).toEqual([
        {
          title: {
            text: 'Marine plan policy considerations',
            classes: 'govuk-link--no-visited-state'
          },
          href: marineLicenceRoutes.MARINE_LICENCE_MARINE_PLAN_POLICIES,
          status: {
            tag: { text: 'Not yet started', classes: 'govuk-tag--blue' }
          }
        }
      ])
    })

    test.each([
      ['INCOMPLETE', 'ready'],
      ['IN_PROGRESS', 'ready'],
      ['COMPLETED', undefined],
      ['COMPLETED', 'pending'],
      ['COMPLETED', 'failed'],
      [undefined, undefined]
    ])(
      'returns "Cannot start yet" (no link) when siteDetails=%s and job=%s',
      (siteDetails, marinePlanPolicyJob) => {
        expect(
          transformMarinePlanPoliciesTaskList(
            { siteDetails },
            { marinePlanPolicyJob, marinePlanPoliciesCount: 44 }
          )
        ).toEqual([
          {
            title: { text: 'Marine plan policy considerations' },
            status: {
              text: 'Cannot start yet',
              classes: 'govuk-task-list__status--cannot-start-yet'
            }
          }
        ])
      }
    )
  })

  describe('transformWaterFrameworkDirectiveTaskList', () => {
    test('correctly returns Completed status', () => {
      expect(
        transformWaterFrameworkDirectiveTaskList({
          waterFrameworkDirective: 'COMPLETED'
        })
      ).toEqual([
        {
          href: marineLicenceRoutes.MARINE_LICENCE_WATER_FRAMEWORK_DIRECTIVE_BEFORE_YOU_START,
          status: { text: 'Completed' },
          title: {
            classes: 'govuk-link--no-visited-state',
            text: 'Water Framework Directive assessment'
          }
        }
      ])
    })

    test('correctly returns In progress', () => {
      expect(
        transformWaterFrameworkDirectiveTaskList({
          waterFrameworkDirective: 'IN_PROGRESS'
        })
      ).toEqual([
        {
          href: marineLicenceRoutes.MARINE_LICENCE_WATER_FRAMEWORK_DIRECTIVE_BEFORE_YOU_START,
          status: {
            tag: { text: 'In progress', classes: 'govuk-tag--teal' }
          },
          title: {
            classes: 'govuk-link--no-visited-state',
            text: 'Water Framework Directive assessment'
          }
        }
      ])
    })

    test.each([null, 'INCOMPLETE', undefined])(
      'correctly returns Not yet started for %s',
      (value) => {
        expect(
          transformWaterFrameworkDirectiveTaskList({
            waterFrameworkDirective: value
          })
        ).toEqual([
          {
            href: marineLicenceRoutes.MARINE_LICENCE_WATER_FRAMEWORK_DIRECTIVE_BEFORE_YOU_START,
            status: {
              tag: { text: 'Not yet started', classes: 'govuk-tag--blue' }
            },
            title: {
              classes: 'govuk-link--no-visited-state',
              text: 'Water Framework Directive assessment'
            }
          }
        ])
      }
    )
  })
})
