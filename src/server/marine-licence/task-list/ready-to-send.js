import {
  transformFeeEstimateTaskList,
  transformMarinePlanPoliciesTaskList,
  transformOtherPermissionsTaskList,
  transformProjectDetailsTaskList,
  transformSharingTaskList,
  transformSiteDetailsTaskList,
  transformWaterFrameworkDirectiveTaskList
} from '#src/server/marine-licence/task-list/utils.js'

export const transformTaskLists = (
  taskList,
  isCitizen,
  {
    waterFrameworkDirective,
    marinePlanPolicyJob,
    marinePlanPoliciesCount,
    marinePlanPolicyResponseCount,
    siteDetailsDataComplete
  }
) => ({
  feeEstimate: transformFeeEstimateTaskList(taskList),
  otherPermissions: transformOtherPermissionsTaskList(taskList, isCitizen),
  sharing: transformSharingTaskList(taskList),
  projectDetails: transformProjectDetailsTaskList(taskList),
  siteDetails: transformSiteDetailsTaskList(taskList),
  waterFrameworkDirective: transformWaterFrameworkDirectiveTaskList(
    taskList,
    waterFrameworkDirective
  ),
  marinePlanPolicies: transformMarinePlanPoliciesTaskList(taskList, {
    marinePlanPolicyJob,
    marinePlanPoliciesCount,
    marinePlanPolicyResponseCount,
    siteDetailsDataComplete
  })
})

export const hasCompletedAllTasks = (taskLists) =>
  [
    ...taskLists.otherPermissions,
    ...taskLists.sharing,
    ...taskLists.projectDetails,
    ...taskLists.siteDetails,
    ...taskLists.waterFrameworkDirective,
    ...taskLists.feeEstimate,
    ...taskLists.marinePlanPolicies
  ].every((task) => task.status.text === 'Completed')

export const isMarineLicenceReadyToSend = (marineLicence, isCitizen) =>
  hasCompletedAllTasks(
    transformTaskLists(marineLicence.taskList, isCitizen, marineLicence)
  )
