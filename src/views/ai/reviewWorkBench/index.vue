<!-- 评审工作台 -->
<template>
  <div class="container" v-loading="loading" v-show="isShowPage">
    <el-row :gutter="10" class="container_top">
      <template v-for="(item, index) in menuList" :key="index">
        <el-col
          :style="!item.canClick ? { cursor: `not-allowed` } : {}"
          :span="8"
          class="card_column card_top"
          :class="clickTab === index && item.canClick ? 'card_top_active' : ''"
          @click="clickAppNo(item, index)"
        >
          <div
            class="worker_list_card"
            :style="{
              border: item.canClick ? `1px solid ${item.borderColor}` : `1px solid #edeff2`,
              backgroundColor: item.canClick ? `${item.backgroundColor}` : `#f9fafb`
            }"
          >
            <div class="card_column_title">
              <i class="el-icon-document cardIcon" :style="{ color: item.canClick ? `${item.iconColor}` : `#c5cad1` }"></i>
              <span :style="{ color: item.canClick ? `${item.iconColor}` : `#c1c6ce` }">{{ item.name }}</span>
              <el-tag style="margin-left: auto" v-if="!item.canClick" :type="'info'"> {{ `未授权` }} </el-tag>
              <el-tag style="margin-left: auto" v-if="item.canClick && clickTab !== index" :type="'warning'"> {{ `已授权` }} </el-tag>
              <el-tag style="margin-left: auto" v-if="item.canClick && clickTab == index" :type="'success'"> {{ `已选中` }} </el-tag>
            </div>
            <div class="card_column_meun" v-if="item.canClick">
              <template v-for="(value, index1) in item.tab" :key="index1">
                <div class="card_column_item_meun" @click.stop="handleRequired(value)">{{ value.name }}</div>
              </template>
            </div>
          </div>
        </el-col>
      </template>
    </el-row>
    <el-row :gutter="10" class="container_bottom">
      <el-col :span="16" class="card_column">
        <div class="worker_list_card">
          <div class="bottom_top">
            <span>{{ chooseTab?.listTitle }}</span>
            <el-input clearable v-model="textValue" @clear="handleSearch" type="text" class="search_input" :placeholder="`${chooseTab?.placeholder}`">
              <template #prefix>
                <i class="el-icon-search" @click="handleSearch" style="color: var(--color-primary, #00857c); cursor: pointer; font-size: 18px"></i>
              </template>
            </el-input>
          </div>
          <div class="bottom_middle">
            <div class="btn_type">
              <template v-for="(item, index) in chooseTab?.btn" :key="index">
                <div
                  @click="handleClickBtn(item)"
                  class="btn_type_name"
                  :class="btnType == item.code ? 'btn_type_name_active' : ''"
                  :style="{ color: btnType == item.code ? `${chooseTab?.iconColor}` : '' }"
                  >{{ `${item.name}(${item.num})` }}</div
                >
              </template>
            </div>
            <div class="btn_type">
              <template v-for="(item, index) in chooseTab?.status" :key="index">
                <div
                  @click="handleClickStauts(item)"
                  class="btn_type_name"
                  :class="statusType == item.code ? 'btn_type_name_active' : ''"
                  :style="{ color: statusType == item.code ? `${chooseTab?.iconColor}` : '' }"
                  >{{ `${item.name}(${item.num})` }}</div
                >
              </template>
            </div>
          </div>
          <div class="list_container" v-if="meetingData.length != 0">
            <template v-for="meeting in meetingData" :key="meeting.meetingId">
              <div class="meeting_car">
                <div class="meeting_car_status">
                  <el-tag :type="'success'">
                    {{ meeting.type == '1' ? `省级联合会审会议` : `市级联合会审会议` }}
                  </el-tag>
                  <el-tag :type="getReviewTagType(meeting.status)">
                    {{ `${meeting.statusName}` }}
                  </el-tag>
                </div>
                <div class="meeting_name"> {{ meeting.meetingName }} </div>
                <div class="meeting_time">
                  <i style="font-size: 14px" class="el-icon-timer"></i>
                  <span>{{ `${meeting.startTime}~${meeting.endTime}` }} </span>
                  <i style="margin-left: 10px" class="el-icon-user"></i>
                  <span>{{ `${meeting.expertCount}人` }}</span>
                </div>
                <div class="meeting_conut">
                  <el-tooltip effect="dark" content="项目数" placement="top">
                    <div>
                      <i style="color: #6882ac" class="el-icon-files"></i>
                      <span style="color: #000; margin-left: 5px">{{ meeting.totalCount }}</span>
                    </div>
                  </el-tooltip>
                  <el-tooltip effect="dark" content="已评审" placement="top">
                    <div>
                      <i style="color: #2c9d87" class="el-icon-circle-check"></i>
                      <span style="color: #2c9d87; margin-left: 5px">{{ meeting.reviewedCount }}</span>
                    </div>
                  </el-tooltip>
                  <el-tooltip effect="dark" content="退回数" placement="top">
                    <div>
                      <i style="color: #ef4754" class="el-icon-circle-close"></i>
                      <span style="color: #ef4754; margin-left: 5px">{{ meeting.thCount }}</span>
                    </div>
                  </el-tooltip>
                  <el-tooltip effect="dark" content="待评审" placement="top">
                    <div>
                      <i style="color: #f7a73e" class="el-icon-timer"></i>
                      <span style="color: #f7a73e; margin-left: 5px">{{ meeting.pendingReviewCount }}</span>
                    </div>
                  </el-tooltip>
                  <div
                    class="handleMeeting hover:bg-blue-500"
                    v-if="['01', '02'].includes(meeting.status)"
                    :style="{ background: `${chooseTab?.iconColor}` }"
                    @click.stop="handleMeeting(meeting)"
                    >{{ meeting.status == '01' ? '进入评审→' : '查看详情→' }}</div
                  >
                </div>
              </div>
            </template>
          </div>
          <div class="list_container" v-else style="display: flex; justify-items: center; align-items: center">
            <el-empty style="margin: 0 auto" description="暂无数据" />
          </div>
          <div class="main-pagination">
            <el-pagination
              :current-page="page.page"
              background
              :page-sizes="[50, 100, 200, 500]"
              :page-size="page.limit"
              :total="parseInt(page.total + '')"
              layout="total, sizes, prev, pager, next, jumper"
              @size-change="handleSizeChange"
              @current-change="handleCurrentChange"
            ></el-pagination>
          </div>
        </div>
      </el-col>
      <el-col :span="8" class="card_column">
        <div class="worker_list_card">
          <div class="bottom_top">
            <span>{{ chooseTab?.dataTitle }}</span>
          </div>
          <div class="worker_meeting" :style="{ border: `1px solid ${chooseTab?.borderColor}`, backgroundColor: `${chooseTab?.backgroundColor}` }">
            <div class="worker_percentTitle">{{ chooseTab?.percentTitle }}</div>
            <div class="worker_percent" :style="{ color: `${chooseTab?.iconColor}` }">{{ chooseTab?.percent }}<span>%</span></div>
            <el-progress :color="`${chooseTab?.iconColor}`" :show-text="false" :stroke-width="10" :percentage="`${chooseTab?.percent}`" />
            <div style="font-size: 12px">{{ `${chooseTab?.content1}${chooseTab?.total}${chooseTab?.content2}` }}</div>
          </div>
          <div class="worker_tjwd">
            <template v-for="(item, index) in statItems" :key="index">
              <div class="worker_tjwd_item">
                <div class="worker_tjwd_svgbg" :class="item.bgColor">
                  <div class="worker_tjwd_svg" :class="item.color">
                    <svg fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        d="M3.75 3v11.25A2.25 2.25 0 0 0 6 16.5h2.25 M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0 1 18 16.5h-2.25m-7.5 0h7.5m-7.5 0-1 3m8.5-3 1 3m0 0 .5 1.5m-.5-1.5h-9.5m0 0-.5 1.5"
                      />
                    </svg>
                  </div>
                </div>
                <div class="worker_tjwd_name">
                  <div>{{ item.label }}</div>
                  <div>
                    {{ item.value }} <span> {{ item.suffix }} </span>
                  </div>
                </div>
              </div>
            </template>
          </div>
        </div>
      </el-col>
    </el-row>
  </div>
  <!-- 登录 -->
  <userDialog ref="userDialogRef" @loadCompany="getRoleHandle" />
</template>
<script lang="ts" setup name="/ai/reviewWorkBench/index">
import { ref, reactive, onMounted } from 'vue'
import userDialog from '@/components/select/userDialog.vue'
import { ElMessage } from 'element-plus'
import baseService from '@/service/baseService'
import { getAppMenuData } from '@/api/lkyptzl/index'
import { getAppListPageData } from '@/api/sys/appManager'
import { meetingParam } from '@/views/ai/reviewWorkBench/hooks/index'
import { buildMeetingEntryPayload, loadAiAuditParams } from '@/views/ai/reviewWorkBench/utils/aiAudit'
import { getMeetingCountByStatus, getMeetingCountByType, getMeetingPage, getReviewStat } from '@/api/ai/reviewWorkBench'
import { encrypt } from '@/utils/crypto'
import { getListPageDataByAccount } from '@/api/service/IhhsMeeting/expertReview'

const loading = ref(false)
const isShowPage = ref(false) //未选择角色前不展示页面
const { page, statItems, menuList, router, store } = meetingParam()
const userInfo = ref<any>()
const canRerunAiAudit = ref(true)
const userDialogRef = ref()
const clickTab = ref<any>(1)
const textValue = ref<string>('')
const chooseTab = ref<any>()
const btnType = ref<string>('')
const statusType = ref<string>('')
const meetingData = ref<any[]>([])
// 用户信息
const expertInfo = reactive({
  expertName: '张明远',
  expertId: ''
})
// 获取会议标签类型
const getReviewTagType = (count: string) => {
  if (count === '00') return 'warning'
  if (count === '01') return 'success'
  if (count === '02') return 'info'
  return 'danger'
}

const handleCurrentChange = async (val: number) => {
  if (val <= 0) return
  page.page = val
}

const handleSizeChange = async (val: number) => {
  if (val <= 0) return
  page.limit = val
  page.page = 1
}

const clickAppNo = (val: any, index: any) => {
  if (!val.canClick) return
  clickTab.value = index
  chooseTab.value = val
  btnType.value = ''
  statusType.value = ''
}

const handleClickBtn = (val: any) => {
  btnType.value = val.code
  statusType.value = ''
  page.page = 1
  page.limit = 100
  getMeetingCountZt()
  getMeeting()
}

const handleClickStauts = (val: any) => {
  statusType.value = val.code
  page.page = 1
  page.limit = 100
  getMeeting()
}

const handleRequired = async (operation: any) => {
  let res = await baseService.get(`/sysMenu/getButtonList?menuCode=${operation.outsideMenu}&spRoleId=${userInfo.value.id}`)
  if (res.success) {
    if (res.success) {
      store.commit('setPermissions', res.data)
    }
  }
  const routeOptions: Record<string, any> = {
    name: operation.url,
    params: { formJsc: '1' }
  }
  if (String(operation.url || '').startsWith('/service/jointReview')) {
    routeOptions.query = {
      source: 'reviewWorkBench',
      canRerun: canRerunAiAudit.value ? '1' : '0'
    }
  }
  router.push(routeOptions)
}
const handleMeeting = (meeting: any) => {
  // 进入省级 expertReview 时需带 specialorgcode，AI 审核意见按部门可见性依赖该字段
  const str: any = encrypt(
    JSON.stringify(
      buildMeetingEntryPayload({
        meetingId: meeting.meetingId,
        expertName: expertInfo.expertName,
        expertId: expertInfo.expertId,
        tag: meeting.status == '01' ? 'review' : 'view',
        userInfo: userInfo.value || {},
        canRerun: canRerunAiAudit.value
      })
    )
  )
  router.push({
    name: meeting.type == '1' ? '/service/jointReview/expertReview/projectManifest' : '/reviewDeatil/index',
    query: {
      params: str,
      meetingParams: str
    }
  })
}

const getApi = async () => {
  loading.value = true
  try {
    const code: any = await getAppListPageData({
      page: 1,
      limit: 100
    })
    const res: any = await getAppMenuData()
    // 后端/mock 可能未配置 LHHS_* 应用，缺省时保留 hooks 中的默认名称，避免 codenName.appName 空指针
    const appRecords = code?.data?.records || []
    const menuData = res?.data || {}
    menuList.value.forEach((menu: any) => {
      const codenName = appRecords.find((item: any) => item.appNo == menu.code)
      if (codenName?.appName) {
        menu.name = codenName.appName
      }
      menu.tab.length = 0
      if (menuData[menu.code]) {
        if (menuData[menu.code]['1']?.length > 0) {
          menu.tab.push(...menuData[menu.code]['1'])
        }
        if (menuData[menu.code]['2']?.length > 0) {
          menu.tab.push(...menuData[menu.code]['2'])
        }
      }
    })
    chooseTab.value = menuList.value[1]
  } finally {
    loading.value = false
    isShowPage.value = true
  }
}
//获取会议数量(按会议类型统计)
const getMeetingCountSs = async () => {
  const res: any = await getMeetingCountByType({ search: textValue.value })
  if (!res.success) return ElMessage.error(res.msg)
  menuList.value[1].btn.forEach((type: any) => {
    const code: any = res.data.filter((res: any) => res.code == type.code)
    if (code.length == 1) type.num = code[0].count
  })
}
//获取会议数量(按会议状态统计)
const getMeetingCountZt = async () => {
  const res: any = await getMeetingCountByStatus({ search: textValue.value, type: btnType.value })
  if (!res.success) return ElMessage.error(res.msg)
  menuList.value[1].status.forEach((status: any) => {
    const code: any = res.data.filter((res: any) => res.code == status.code)
    if (code.length == 1) status.num = code[0].count
  })
}

const handleSearch = async () => {
  await getMeeting()
  await getMeetingCountSs()
  await getMeetingCountZt()
}

// 分页查询会议
const getMeeting = async () => {
  const params = {
    search: textValue.value,
    type: btnType.value,
    status: statusType.value,
    page: page.page,
    limit: page.limit
  }
  const res: any = await getMeetingPage({ ...params })
  if (!res.success) return ElMessage.error(res.msg)
  page.total = res.data.total
  meetingData.value = res.data.records
}
//获取评审统计
const getReview = async () => {
  const res: any = await getReviewStat()
  if (!res.success) return ElMessage.error(res.msg)
  statItems.forEach((stat: any) => {
    stat.value = res.data[stat.code]
  })
  const cyhy = statItems[0].value
  const yjshy = statItems[1].value
  chooseTab.value.total = cyhy
  chooseTab.value.percent = Number((yjshy / cyhy) * 100).toFixed(2)
}

const initData = async () => {
  await getApi()
  await getMeetingCountSs()
  await getMeetingCountZt()
  await getMeeting()
  await getReview()
}
// 获取专家信息
const getExperytInfo = async () => {
  try {
    const count: any = store.getters.getUserMsg
    const res: any = await getListPageDataByAccount({ account: count.namecode })
    if (res.success && res.data?.records.length != 1) {
      ElMessage.warning('当前账号对应多个专家，请检查')
      loading.value = false
      return
    }
    if (res.success) {
      const expert = res.data.records[0]
      expertInfo.expertName = expert.expertName
      expertInfo.expertId = expert.id
      loading.value = false
      await initData()
    }
  } catch (error) {
    ElMessage.error((error as Error).message)
  }
}

const getRoleHandle = async () => {
  isShowPage.value = false
  loading.value = true
  try {
    const isQuery = userDialogRef.value.isQuery
    userInfo.value = { ...userDialogRef.value.userMsg }
    if (isQuery) {
      const flagData = await baseService.post(`/workflow/cbxqsh/getFqzz?spOrgId=${userInfo.value.specialorgid}`)
      const globalInfo: any = {
        userId: store.getters.getUserMsg.id,
        deptId: userInfo.value.specialorgid,
        deptName: userInfo.value.specialorgname,
        dwId: userInfo.value.org_id,
        dwName: userInfo.value.org_name,
        roleId: userInfo.value.role_id,
        roleCode: userInfo.value.code,
        spRoleId: userInfo.value.id,
        specialorgcode: userInfo.value.specialorgcode,
        fqzzFlag: flagData.data
      }
      store.commit('setJRGlobalInfo', globalInfo)
      store.commit('setXqGlobalInfo', globalInfo)
      store.commit('setCbGlobalInfo', globalInfo)
      store.commit('setZlGlobalInfo', globalInfo)
      await getExperytInfo()
    }
  } catch (error) {
    ElMessage.error((error as Error).message)
  } finally {
    isShowPage.value = true
    loading.value = false
  }
}
// 方法
onMounted(async () => {
  const aiAuditParams = await loadAiAuditParams()
  canRerunAiAudit.value = aiAuditParams.canRerun
  await userDialogRef.value.getUser()
})
</script>
<style scoped lang="less">
@import (less) './css/index.css';
</style>
