import { jointReviewModule } from './jointReview'
import { projectReserveModule } from './projectReserve'
import { requirementLibraryModule } from './requirementLibrary'
import type { ModuleId, WorkbenchModule } from '../types'

export const workbenchModules: WorkbenchModule[] = [requirementLibraryModule, jointReviewModule, projectReserveModule]

export const defaultModuleId: ModuleId = workbenchModules[0].id

export const getWorkbenchModule = (moduleId: ModuleId): WorkbenchModule => {
  return workbenchModules.find((module) => module.id === moduleId) || requirementLibraryModule
}
