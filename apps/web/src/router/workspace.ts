import type { RouteRecordNameGeneric } from 'vue-router'

export const UNMATCHED_ROUTE_NAME = 'WorkspaceUnmatched'

export interface WorkspaceTarget {
  path: string
  matched: readonly { name?: RouteRecordNameGeneric }[]
}

export const isUnmatchedRoute = (to: WorkspaceTarget): boolean =>
  !to.matched.length || to.matched.some((record) => record.name === UNMATCHED_ROUTE_NAME)

/** 守卫只依赖工作区能力；实现和插件、store 的组装留在 app 层。 */
export interface WorkspaceController {
  readonly isReady: boolean
  initialize(to: WorkspaceTarget): Promise<void>
  prepareStandalone(): Promise<void>
  reset(): void
}
