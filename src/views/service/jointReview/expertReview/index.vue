<!-- 联合会审驾驶舱（专家） -->
<template>
  <div class="container" v-if="isShowPage" v-loading="loading">
    <!-- 顶部区域 -->
    <el-row :gutter="10" class="top-section">
      <!-- 左侧：用户资料 -->
      <el-col :span="6">
        <el-card shadow="never" class="user-profile-card">
          <div class="user-profile">
            <el-tooltip effect="light" placement="bottom">
              <img class="pepole_icons" v-if="expertInfo.sex == '1'" src="@/assets/images/woman.jpg" />
              <img class="pepole_icons" v-else src="@/assets/images/man.jpg" />
              <template #content>
                <div style="width: 350px">{{ expertInfo.resume }}</div>
              </template>
            </el-tooltip>
            <div class="user-name">{{ expertInfo.expertName }}</div>
            <div class="user-role">{{ `${expertInfo.majorName}专家` }}</div>
          </div>
        </el-card>
      </el-col>
      <!-- 中间：评审概览和排名 -->
      <el-col :span="9">
        <el-card shadow="never" class="user-profile-card">
          <div class="overview-title">
            <i style="color: var(--color-primary, #00857c); font-size: 20px" class="el-icon-s-marketing top_icons"></i>
            评审概览
          </div>
          <div class="overview-stats">
            <div class="stat-item stat_blue">
              <div class="stat-label"> <i class="el-icon-user stat-icon"></i>累计参与评审会议数</div>
              <div class="stat-value">
                {{ Number(overviewData.cypshysl).toLocaleString() }}
              </div>
            </div>
            <div class="stat-item stat_purple">
              <div class="stat-label"> <i class="el-icon-folder-opened stat-icon"></i>累计评审项目数</div>
              <div class="stat-value">
                {{ Number(overviewData.xmsl).toLocaleString() }}
              </div>
            </div>
          </div>
        </el-card>
      </el-col>

      <!-- 右侧：消息通知 -->
      <el-col :span="9">
        <el-card shadow="never" class="user-profile-card">
          <div class="overview-title">
            <i style="color: var(--color-primary, #00857c); font-size: 20px" class="el-icon-message"></i>
            <el-badge :offset="[10, 5]" :value="messageList.length" :max="99" :is-dot="messageList.length == 0">
              <span style="padding-right: 10px">催办消息</span>
            </el-badge>
          </div>
          <el-empty class="messageEmpty" v-if="messageList.length == 0" description="暂无消息"></el-empty>
          <div class="message-list" v-else-if="messageList.length == 1">
            <div @click="handleTask(msg)" v-for="(msg, index) in messageList" :key="index" class="message-item">
              <div class="message-icon">
                <i style="font-size: 18px" class="el-icon-document"></i>
              </div>
              <div class="message-content">
                <div class="message-content-top">
                  <div class="message-title">{{ msg.activityDefName }}</div>
                  <div class="message-time">{{ msg.startTime }}</div>
                </div>
                <div class="message-text">{{ msg.bizName }}</div>
              </div>
            </div>
          </div>
          <div class="message-list" v-else>
            <div class="meaasge-scroll" :style="{ animationDuration: `${messageList.length + messageList.length}s` }">
              <div @click="handleTask(msg)" v-for="(msg, index) in messageList" :key="index" class="message-item">
                <div class="message-icon">
                  <i style="font-size: 18px" class="el-icon-document"></i>
                </div>
                <div class="message-content">
                  <div class="message-content-top">
                    <div class="message-title">{{ msg.activityDefName }}</div>
                    <div class="message-time">{{ msg.startTime }}</div>
                  </div>
                  <div class="message-text">{{ msg.bizName }}</div>
                </div>
              </div>
              <div @click="handleTask(msg)" v-for="(msg, index) in messageList" :key="index" class="message-item">
                <div class="message-icon">
                  <i style="font-size: 18px" class="el-icon-document"></i>
                </div>
                <div class="message-content">
                  <div class="message-content-top">
                    <div class="message-title">{{ msg.activityDefName }}</div>
                    <div class="message-time">{{ msg.startTime }}</div>
                  </div>
                  <div class="message-text">{{ msg.bizName }}</div>
                </div>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 主区域：项目列表 -->
    <div shadow="never" class="project-list-card">
      <!-- 搜索和筛选 -->
      <div class="search-filter-section">
        <el-input v-model="searchKeyword" placeholder="搜索会议名称、编号..." class="search-input" clearable @input="handleSearch">
          <template #prefix>
            <i style="font-size: 18px" class="el-icon-search"></i>
          </template>
        </el-input>
        <div class="filter-tabs">
          <div class="filter-tabsLeft">
            <el-tabs v-model="activeFilterTab">
              <el-tab-pane :key="item.label" v-for="item in filterTabs" :label="item.label" :name="item.value" />
            </el-tabs>
          </div>
          <div class="filter-tabsRight">
            <el-tooltip content="刷新" placement="top" effect="light">
              <span class="toolbar-action-icon" style="cursor: pointer; font-size: 18px" @click="refresh">
                <i class="el-icon-refresh"></i>
              </span>
            </el-tooltip>
            <ToolbarButtons :tool-button="['help']" @help-click="getHelpMessageHandle" />
          </div>
        </div>
      </div>

      <!-- 项目列表 -->
      <div class="project-list">
        <div v-for="(project, index) in filteredProjects" :key="index" class="project-card">
          <div class="project-header">
            <div class="project-id">{{ project.meetingCode }}</div>
            <div class="project-title">{{ project.meetingName }}</div>
            <el-tag v-if="project.ysly" :type="project.ysly === '1' ? 'success' : 'warning'" size="small">
              {{ project.yslyName }}
            </el-tag>
            <div class="project-summary">
              ({{ `项目数：${project.totalCount}，退回数：${project.thCount}、已评审：${project.reviewedCount}、` }}
              <span style="color: red">{{ `待评审：${project.pendingReviewCount}` }}</span>
              )
            </div>
            <div :class="['project-status', `status-${project.meetingStatus}`]">
              <i style="font-size: 18px; cursor: pointer" class="el-icon-bell"></i>
              <span>{{ getStatusText(project.meetingStatus) }}</span>
            </div>
          </div>
          <div style="display: flex; align-items: center; justify-content: space-between">
            <div class="project-info">
              <template v-if="project.pspcId">
                <div class="info-item">
                  <i style="font-size: 18px" class="el-icon-timer"></i>
                  <span>线上预审起止时间：{{ `${project.lhhsOneStartTime}~${project.lhhsOneEndTime}` }}</span>
                </div>
                <div class="info-item">
                  <i style="font-size: 18px" class="el-icon-timer"></i>
                  <span>线下会审起止时间：{{ `${project.lhhsTwoStartTime}~${project.lhhsTwoEndTime}` }}</span>
                </div>
              </template>
              <template v-else>
                <div class="info-item">
                  <i style="font-size: 18px" class="el-icon-timer"></i>
                  <span>会议起止时间：{{ `${project.startTime}~${project.endTime}` }}</span>
                </div>
              </template>
              <el-dropdown style="margin: 0 10px" placement="bottom" v-if="project.meetingAttachList.length != 0">
                <div class="info-item" style="color: var(--color-primary, #00857c); cursor: pointer">
                  <i style="font-size: 18px" class="el-icon-bell"></i>
                  <span>附件信息</span>
                </div>
                <template #dropdown>
                  <el-dropdown-menu>
                    <template v-for="(item, index) in project.meetingAttachList" :key="index">
                      <el-dropdown-item @click="downLoadFile(item)">{{ item.attachName }}</el-dropdown-item>
                    </template>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </div>
            <div>
              <el-button v-permission="'ZJPSJD'" size="mini" type="primary" plain @click="openExpertProcess(project)">专家评审进度</el-button>
              <el-button v-if="project.meetingStatus == '01'" size="mini" type="primary" plain @click="enterReview(project)">进入评审</el-button>
              <el-button v-else size="mini" type="primary" plain @click="viewReview(project)">查看</el-button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
  <!-- 帮助 -->
  <HelpModal ref="helpModalRef" />
  <!-- 登录 -->
  <userDialog ref="userDialogRef" @loadCompany="getRoleHandle"></userDialog>
  <!-- 专家评审进度 -->
  <ExpertProcessModal ref="expertProcessModalRef" />

  <vxe-modal
    :loading="loading"
    show-zoom
    resize
    fullscreen
    destroy-on-close
    @close="closeTodoTaskDeal"
    :title="todoTasksFrame.title"
    v-model="todoTasksFrame.isShowDialog"
    width="86%"
    height="800px"
  >
    <div class="frame-container">
      <iframe
        ref="iframeRef"
        @load="checkAccess"
        frameborder="0"
        scrolling="auto"
        style="border: none"
        width="100%"
        height="100%"
        :src="todoTasksFrame.src"
      ></iframe>
    </div>
  </vxe-modal>
</template>

<script lang="ts" setup name="/service/jointReview/expertReview/index">
import userDialog from '@/components/select/userDialog.vue'
import { onMounted, ref } from 'vue'
import { meetingReview } from '@/views/service/jointReview/expertReview/hooks/zym'
import { helpModalMeun } from '@/views/service/jointReview/hooks/help'
import HelpModal from '@/components/HelpModal/index.vue'
import ToolbarButtons from '@/components/ToolbarButtons/index.vue'
import ExpertProcessModal from '@/views/service/jointReview/components/ExpertProcessModal.vue'
import { ElMessage } from 'element-plus'

const {
  userDialogRef,
  isShowPage,
  loading,
  expertInfo,
  overviewData,
  searchKeyword,
  filterTabs,
  activeFilterTab,
  filteredProjects,
  getStatusText,
  handleSearch,
  enterReview,
  viewReview,
  getRoleHandle,
  store,
  useUser,
  route,
  userInfo,
  getExperytInfo,
  downLoadFile,
  refresh,
  messageList,
  workflowMsg,
  todoTasksFrame,
  closeTodoTaskDeal,
  checkAccess,
  iframeRef,
  handleTask
} = meetingReview()

const { helpModalRef, getHelpMessageHandle } = helpModalMeun()
const expertProcessModalRef = ref<InstanceType<typeof ExpertProcessModal> | null>(null)

// 专家评审进度
const openExpertProcess = (project: any) => {
  if (!project?.meetingId) {
    ElMessage.warning('请选择一条会议数据')
    return
  }
  const info = userInfo.value || {}
  expertProcessModalRef.value?.acceptParams({
    row: {
      meetingId: project.meetingId,
      meetingCode: project.meetingCode
    },
    userInfo: {
      deptId: info.deptId || info.specialorgid || '',
      dwId: info.dwId || info.org_id || '',
      roleCode: info.roleCode || info.code || '',
      roleId: info.roleId || info.role_id || ''
    }
  })
}

onMounted(async () => {
  var isRoel = await useUser('getJRGlobalInfo')
  if (isRoel && route.params.formJsc) {
    userInfo.value = store.getters.getJRGlobalInfo
    await getExperytInfo()
    await workflowMsg()
  } else {
    await userDialogRef.value.getUser()
  }
  window.onmessage = function (e) {
    if (e.data) {
      todoTasksFrame.isShowDialog = false
      if (e.data !== 'close') ElMessage.success(e.data)
      workflowMsg()
    }
  }
})
</script>

<style scoped lang="less">
@import 'css/index';
</style>
