<template>
  <div class="analysis">
    <div class="analysis__body card-container">
      <div @click="() => handleSelect(item)" :key="index" v-for="(item, index) in dataList" class="card-item">
        <div class="card-title">
          <TextOverHiddenTooltip :text="item.cwProjectVo.name" />
        </div>
        <div class="card-details">
          <TextOverHiddenTooltip :text="item.cwProjectVo.affiliateDeptName" />
          <TextOverHiddenTooltip :text="item.cwProjectVo.projectLead" />
          <TextOverHiddenTooltip :text="item.cwProjectVo.submitTime" />
          <TextOverHiddenTooltip :text="item.cwProjectVo.applyTaxExclusive" />
        </div>
        <div class="card-info">
          <span> 实施背景： </span>
          <TextOverHiddenTooltip :wrapNumber="2" :text="item.cwProjectApplyVo.implBackground" />
        </div>
        <div class="card-info">
          <span> 实施内容： </span>
          <TextOverHiddenTooltip :wrapNumber="2" :text="item.cwProjectApplyVo.implContent" />
        </div>
        <!-- <div class="card-right ">
          <span class="danger">{{item.vectorScore}}%</span>
        </div> -->
        <span class="status">
          <base-tag class="status--tag" size="small" :type="getType(item.cwProjectVo.reserveStatus)">{{
            getStatus(item.cwProjectVo.reserveStatus)
          }}</base-tag>
        </span>
      </div>
    </div>
  </div>
</template>
<script>
/**
 * 三区三县
 */

import { CwProjectDiff, CwProject } from '@/api/mainController'

export default {
  components: {},
  props: {
    projectId: {
      type: String
    }
  },
  name: 'sameItemAnalysis',
  data() {
    return {
      dataList: [],
      reserveStatus: []
    }
  },
  created() {
    this.getReserveStatus()
  },
  mounted() {
    this.getList()
  },
  methods: {
    getStatus(reserveStatus) {
      return this.reserveStatus.find((item) => item.key == reserveStatus)?.value
    },
    getReserveStatus() {
      CwProject.reserveStatus(this, {}).then((res) => {
        this.reserveStatus = res.data
      })
    },
    handleSelect(item) {
      this.$emit('on-select', item)
    },
    getType(type) {
      let _type = 'primary'
      switch (+type) {
        case this.StatusReserveDict.PENDING_SUBMIT:
          _type = 'info'
          break
        case this.StatusReserveDict.REJECTED || this.StatusReserveDict.DELAYED:
          _type = 'warning'
          break
        case this.StatusReserveDict.PRE_REVIEW_COMPLETED:
          _type = 'success'
          break
      }
      return _type
    },
    getList() {
      CwProjectDiff.sameItemProjectList(this, {
        cwProjectDtoFilter: {
          projectId: this.projectId
        }
      }).then((res) => {
        const { dataList = [] } = res.data
        this.$emit('update:data', dataList)
        this.dataList = dataList
      })
    }
  },
  computed: {},
  watch: {
    projectId: {
      handler(val, oldVal) {
        if (val && oldVal && val != oldVal) {
          this.getList()
        }
      },
      deep: true
    }
  }
}
</script>
<style lang="less" scoped>
.card-container {
  // display: flex;
  // flex-direction: column;
  // flex-wrap: wrap;
  // gap: 10px;
  padding: 5px 0;
}

.card-item {
  // flex: 1 1 calc((100% - 20px) / 3); /* 计算让 3 个 item 均分整行 */
  // height: 115px;
  display: flex;
  flex-direction: column;
  height: 180px;
  background: #ffffff;
  border-radius: 8px;
  border: 2px solid transparent;
  box-shadow: 2px 2px 8px rgba(0, 0, 0, 0.1);
  padding: 12px;
  transition: all 0.3s ease-in-out;
  position: relative;
  overflow: hidden;
  cursor: pointer;
  gap: 10px;
  margin: 0 10px 10px 10px;
  /* 左侧内容 */
  .card-left {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    min-width: 0;
    margin-right: 10px;
  }

  /* 标题：绿色，大字体 */
  .card-title {
    font-size: 17px;
    font-weight: bold;
    color: @color-primary;
    // text-decoration: underline;
  }

  /* 左侧 3 行小文本 */
  .card-details {
    font-size: 14px;
    color: #666;
    display: flex;
    margin-right: 80px;
    overflow: hidden;
    width: 100%;
    .text-container__wrapper {
      align-items: center;
      display: flex;
      flex: none;
      &:nth-child(1) {
        max-width: calc(calc(100% - 120px) - 30%);
      }
      &:nth-child(2) {
        max-width: calc(calc(100% - 110px) - 70%);
      }
    }
  }

  /* 给每个span后面添加|分割线（最后一个除外） */
  .card-details .text-container__wrapper:not(:last-child)::after {
    content: '|';
    margin-left: 8px; /* 分割线与右侧内容的间距，可调整 */
    margin-right: 8px;
    color: #999; /* 分割线颜色，可根据设计调整 */
  }

  .card-info {
    display: flex;
    align-items: flex-start;
    span {
      // font-weight: bold;
      color: @color-primary;
    }
  }

  /* 右侧文字（居中对齐） */
  .card-right {
    // width: 80px; /* 固定宽度，避免过度紧贴 */
    position: absolute;
    top: 43px;
    right: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 22px;
    font-weight: bold;
    color: @color-success;
    .warning {
      color: @color-warning;
    }
    .danger {
      color: @color-danger;
    }
  }

  .status {
    position: absolute;
    top: 10px;
    right: 10px;
    // .el-tag{
    //   color:#0092FF;
    //   border-color:#b3d8ff;
    // }
  }

  /* 悬浮交互 */
  &:hover {
    border-color: @color-primary;
    box-shadow: 4px 4px 12px rgba(0, 128, 0, 0.2);
    transform: translateY(-4px);
  }
}

/* 解决最后一行单个 item 居中的问题 */
.card-container::after {
  content: '';
  flex-grow: 999; /* 让最后一行的空位不会导致 item 拉伸 */
  width: 0;
}

.analysis {
  height: 100%;
  display: flex;
  flex-direction: column;
  &__body {
    // flex:1;
    overflow: auto;
  }
  &__bottom {
    height: 30px;
    line-height: 30px;
    text-align: right;
    color: @color-primary;
    font-weight: 400;
  }
}
</style>
