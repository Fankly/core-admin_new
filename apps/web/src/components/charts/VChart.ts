import { use } from 'echarts/core'
import * as charts from 'echarts/charts'
import * as components from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'

// vue-echarts uses echarts/core; register the legacy pages' chart types before mounting.
use([...Object.values(charts), ...Object.values(components), CanvasRenderer])

export { default } from 'vue-echarts'
export * from 'vue-echarts'
