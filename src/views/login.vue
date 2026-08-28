<script lang="ts">
import { CacheToken, Permissions } from '@/constants/cacheKey'
import baseService from '@/service/baseService'
import { setCache } from '@/utils/cache'
import { getUuid } from '@/utils/utils'
import { Base64 } from 'js-base64'
import { defineComponent, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAppStore } from '@/store'

export default defineComponent({
  setup() {
    const store = useAppStore()
    const router = useRouter()
    const permissions = ref(true)

    // 自动登录
    // 万能验证码: HE_YUE_11_22_33
    const autoLogin = async () => {
      let params = {
        a: Base64.encode('admin'),
        b: Base64.encode('admin'),
        captcha: Base64.encode('HE_YUE_11_22_33'),
        u: Base64.encode(getUuid())
      }
      let res = await baseService.post('/login', params)
      const permission = await baseService.get('/sysMenu/hasPermission')
      permissions.value = permission.data
      store.setHasPermission(permissions.value)
      if (permissions.value) {
        // token放到缓存里面
        sessionStorage.setItem('permissions', permission.data)
        setCache(CacheToken, res.data, true)
        setCache(Permissions, permission.data, true)
        router.push('/home')
      }
    }

    onMounted(() => {
      autoLogin()
    })

    return { permissions }
  }
})
</script>

<template>
  <div class="msg" v-show="!permissions">
    <!--    居中-->
    <el-result>
      <template v-slot:icon>
        <i class="el-icon-warning" style="font-size: 64px; color: #f5222d"></i>
      </template>
      <template v-slot:title>
        <span style="font-size: 48px; font-weight: 800"> 抱歉，权限不足,无法访问该系统</span>
      </template>
    </el-result>
  </div>
</template>

<style scoped lang="less">
.msg {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
}
</style>
