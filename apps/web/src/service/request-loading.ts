type LoadingHandler = () => () => void
let loadingHandler: LoadingHandler | undefined

/** 返回本次请求自己的清理函数，注册器更换后在途请求仍清理原来的状态。 */
export function startRequestLoading(): (() => void) | undefined {
  return loadingHandler?.()
}

export function setRequestLoadingHandler(handler: LoadingHandler): () => void {
  loadingHandler = handler
  return () => {
    if (loadingHandler === handler) loadingHandler = undefined
  }
}
