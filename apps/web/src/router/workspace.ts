export interface WorkspaceTarget {
  path: string
  matched: readonly unknown[]
}

/** 守卫只依赖工作区能力；实现和插件、store 的组装留在 app 层。 */
export interface WorkspaceController {
  readonly isReady: boolean
  initialize(to: WorkspaceTarget): Promise<void>
  prepareStandalone(): Promise<void>
  reset(): void
}
