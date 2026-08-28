import AILoading from './AILoading/index.vue'
import BaseScrollbar from './BaseScrollbar/index.vue'
import BaseSelect from './BaseSelect/index.vue'
import BaseTag from './BaseTag/index.vue'
import ConfigItem from './ConfigItem/index.vue'
import DashboardContainer from './DashboardContainer/dashboardContainer.vue'
import FilterBox from './FilterBox/index.vue'
import FilterConfigBox from './FilterConfigBox/index.vue'
import FormConfigBox from './FormConfigBox/index.vue'
import TextOverHiddenTooltip from './TextOverHiddenTooltip/index.vue'
import TableBox from '@/components/TableBox/index.vue'
import RejectReason from '@/components/RejectReason/index.vue'
import SingleContainer from '@/components/AutoImport/SingleContainer/index.vue'
import DialogContainer from '@/components/AutoImport/DialogContainer/index.vue'

const components = [
  AILoading,
  BaseScrollbar,
  BaseSelect,
  BaseTag,
  ConfigItem,
  SingleContainer,
  DialogContainer,
  DashboardContainer,
  FilterBox,
  FilterConfigBox,
  FormConfigBox,
  TextOverHiddenTooltip,
  TableBox,
  RejectReason
]

export default {
  install(app) {
    components.forEach((component) => {
      app.component(component.name, component)
    })
  }
}
