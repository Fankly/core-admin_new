import { computed, ref } from 'vue'
import { defineStore } from 'pinia'

/** 业务穿透参数与全局上下文的已知键。 */
export type GlobalContextKey = 'xqGlobalInfo' | 'cbGlobalInfo' | 'JRGlobalInfo' | 'ZlGlobalInfo' | 'LSGlobalInfo' | 'SZWLlobalInfo'

export type GlobalInfoMap = Record<GlobalContextKey, Record<string, unknown>>

const createGlobalInfo = (): GlobalInfoMap => ({
  xqGlobalInfo: {},
  cbGlobalInfo: {},
  JRGlobalInfo: {},
  ZlGlobalInfo: {},
  LSGlobalInfo: {},
  SZWLlobalInfo: {}
})

/**
 * 业务上下文域。
 *
 * 这些字段来自老系统的“穿透参数”，与框架会话/菜单无关；集中在这里，
 * 避免再次把业务上下文塞回全局 app store。新业务优先通过 props / route query 传递，
 * 此 store 仅作为跨页面的遗留通道。
 */
export const useContextStore = defineStore('context', () => {
  const globalInfo = ref<GlobalInfoMap>(createGlobalInfo())
  const penetrateParams = ref<Record<string, unknown>>({})
  const proParams = ref<Record<string, unknown>>({})
  const yssxbm = ref('')
  const oldDwId = ref('')
  const processData = ref<unknown[]>([])

  const getXqGlobalInfo = computed(() => globalInfo.value.xqGlobalInfo)
  const getCbGlobalInfo = computed(() => globalInfo.value.cbGlobalInfo)
  const getJRGlobalInfo = computed(() => globalInfo.value.JRGlobalInfo)
  const getZlGlobalInfo = computed(() => globalInfo.value.ZlGlobalInfo)
  const getLSGlobalInfo = computed(() => globalInfo.value.LSGlobalInfo)
  const getSZWLlobalInfo = computed(() => globalInfo.value.SZWLlobalInfo)

  function setGlobalInfo(key: GlobalContextKey, payload: Record<string, unknown>) {
    globalInfo.value[key] = payload
  }

  function setPenetrateParams(payload: Record<string, unknown>) {
    penetrateParams.value = payload
  }

  function setProParams(payload: Record<string, unknown>) {
    proParams.value = payload
  }

  function setYssxbm(payload: string) {
    yssxbm.value = payload
  }

  function setOldDwId(payload: string) {
    oldDwId.value = payload
  }

  function setProcessData(payload: unknown[]) {
    processData.value = payload
  }

  function reset() {
    globalInfo.value = createGlobalInfo()
    penetrateParams.value = {}
    proParams.value = {}
    yssxbm.value = ''
    oldDwId.value = ''
    processData.value = []
  }

  return {
    globalInfo,
    penetrateParams,
    proParams,
    yssxbm,
    oldDwId,
    processData,
    getXqGlobalInfo,
    getCbGlobalInfo,
    getJRGlobalInfo,
    getZlGlobalInfo,
    getLSGlobalInfo,
    getSZWLlobalInfo,
    setGlobalInfo,
    setPenetrateParams,
    setProParams,
    setYssxbm,
    setOldDwId,
    setProcessData,
    reset
  }
})
