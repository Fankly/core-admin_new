<template>
  <div class="rr-header-right-items">
    <CustomerService :phone="customerMsg.phone" :email="customerMsg.email" />
    <div @click="toggle">
      <span>
        <svg-icon :name="isFullscreen ? 'tuichuquanping' : 'fullscreen2'"></svg-icon>
      </span>
    </div>
    <div class="logout-name">
      <span>
        {{ userName }}
      </span>
    </div>
    <setting-sidebar></setting-sidebar>
  </div>
</template>

<script lang="ts">
import CustomerService from '@/layout/header/CustomerService.vue'
import SvgIcon from '@/components/base/svg-icon'
import baseService from '@/service/baseService'
import { useFullscreen } from '@vueuse/core'
import { defineComponent, ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import SettingSidebar from '../setting/index.vue'
import userLogo from '@/assets/images/user.png'
import '@/assets/css/header.less'
import { ElMessageBox } from 'element-plus'
import { getParamValueMulti } from '@/api/common'

interface IExpand {
  userName?: string
}

/**
 * 顶部右侧扩展区域
 */
export default defineComponent({
  name: 'Expand',
  components: { SettingSidebar, SvgIcon, CustomerService },
  props: {
    userName: String
  },
  setup(props: IExpand) {
    const router = useRouter()
    const { isFullscreen, toggle } = useFullscreen()
    const messageCount = ref(0)
    const customerMsg = reactive({
      phone: '',
      email: ''
    })

    const onClickUserMenus = (path: string) => {
      if (path === '/login') {
        let str = window.location.href
        let index = str.indexOf('?')
        let url = str.substring(0, index)
        ElMessageBox.confirm('确定进行[删除]操作?', '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        })
          .then(() => {
            baseService.get(`/sys/logout?redirUrl=${url}`).then((res) => {
              if (res.success) {
                console.log('已清空cookie')
                location.href = res.data
              } else {
                console.log(res.success)
              }
            })
          })
          .catch(() => {
            //
          })
      } else {
        location.href = '/budget-process'
      }
    }
    const onClickMessage = () => {
      router.push('/notice/notice-user')
    }

    const initParams = async () => {
      try {
        const res = await getParamValueMulti(['SYS_TEL', 'SYS_MAIL'])
        if (res.success && res.data) {
          customerMsg.phone = res.data['SYS_TEL'] || ''
          customerMsg.email = res.data['SYS_MAIL'] || ''
        }
      } catch (error) {
        customerMsg.phone = ''
        customerMsg.email = ''
      }
    }

    onMounted(() => {
      initParams()
    })

    return reactive({
      props,
      customerMsg,
      isFullscreen,
      messageCount,
      userLogo,
      onClickUserMenus,
      onClickMessage,
      toggle
    })
  }
})
</script>
<style scoped>
.logout-name {
  line-height: 50px !important;
}

:deep(.iconfont) {
  vertical-align: baseline;
}
</style>
