<!-- 两上两下驾驶舱 -->
<template>
  <div>
    <div class="custom_steps" v-for="(item, index) in allSteps" :key="index">
      <div class="mid_steps">
        <el-steps align-center space="9.375rem">
          <el-step v-for="(d, i) in item.topSteps" icon="el-icon-success" :key="i" :status="d.state == 1 ? 'finish' : ''">
            <div class="step_title" :title="d.title">{{ d.title }}</div>
            <div class="step_description">{{ d.description }}</div>
          </el-step>
        </el-steps>
        <el-steps align-center space="9.375rem" v-if="item.bottomSteps.length" style="justify-content: flex-end">
          <el-step
            v-for="(d, i) in item.bottomSteps"
            icon="el-icon-success"
            :title="d.title"
            :description="d.description"
            :key="i"
            :status="d.state == 1 ? 'finish' : ''"
          >
            <div class="step_title" :title="d.title">{{ d.title }}</div>
            <div class="step_description">{{ d.description }}</div>
          </el-step>
        </el-steps>
      </div>
      <div class="left_steps">
        <div class="circle" v-if="index >= 1"></div>
      </div>
      <div class="right_steps">
        <div class="circle" v-if="item.bottomSteps.length"></div>
      </div>
    </div>
  </div>
</template>
<script lang="tsx">
export default {
  name: '/service/lslxJsc/main'
}
</script>
<script setup lang="tsx">
import { ref } from 'vue'
const allSteps = ref<any[]>([])

allSteps.value = [
  {
    topSteps: [
      {
        title: '项目录入',
        description: '录入数量1000000',
        state: '1'
      },
      {
        title: '项目审批',
        description: '录入数量1000000',
        state: '0'
      },
      {
        title: '项目变更',
        description: '录入数量1000000',
        state: '0'
      },
      {
        title: '项目审出库',
        description: '录入数量1000000',
        state: '0'
      },
      {
        title: '项目录入',
        description: '录入数量1000000',
        state: '1'
      },
      {
        title: '项目审批',
        description: '录入数量1000000',
        state: '0'
      },
      {
        title: '项目变更',
        description: '录入数量1000000',
        state: '0'
      },
      {
        title: '项目审出库',
        description: '录入数量1000000',
        state: '0'
      },
      {
        title: '项目审出库',
        description: '录入数量1000000',
        state: '0'
      },
      {
        title: '项目录入',
        description: '录入数量1000000',
        state: '1'
      },
      {
        title: '项目审批',
        description: '录入数量1000000',
        state: '0'
      },
      {
        title: '项目变更',
        description: '录入数量1000000',
        state: '0'
      },
      {
        title: '项目审出库',
        description: '录入数量1000000',
        state: '0'
      }
    ],
    bottomSteps: [
      {
        title: '项目录入',
        description: '录入数量1000000',
        state: '1'
      },
      {
        title: '项目审批',
        description: '录入数量1000000',
        state: '0'
      },
      {
        title: '项目变更',
        description: '录入数量1000000',
        state: '0'
      },
      {
        title: '项目审出库',
        description: '录入数量1000000',
        state: '0'
      },
      {
        title: '项目录入',
        description: '录入数量1000000',
        state: '1'
      },
      {
        title: '项目审批',
        description: '录入数量1000000',
        state: '0'
      },
      {
        title: '项目变更',
        description: '录入数量1000000',
        state: '0'
      }
    ]
  }
]
</script>
<style lang="less" scoped>
.custom_steps {
  position: relative;
  display: flex;
  justify-content: center;
  width: 60%;
  height: 80%;
  margin: 0 auto;

  .step_title {
    width: 9.375rem;
    height: 0.8333rem;
    font-size: 0.8333rem;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    // overflow: hidden;
    // display: -webkit-box;
    // -webkit-line-clamp: 2;
    // -webkit-box-orient: vertical;
  }

  .step_description {
    height: 40px;
    font-size: 12px;
  }
  .mid_steps {
    width: calc(~'100% - 160px');
    position: relative;
    z-index: 2;
  }
  .left_steps {
    position: absolute;
    top: -5.1042rem;
    left: 1.5625rem;
    width: 6.7708rem;
    margin-right: -2.6042rem;
    z-index: 1;
    .circle {
      width: 6.7708rem;
      height: 5.9375rem;
      // margin-top: 1.1458rem;
      border: 5px solid #c0c4cc;
      border-radius: 30% 0 0 30%;
      border-right: none;
      // &amp;.finish {
      // 	border-color: #409eff;
      // }
    }
  }

  .right_steps {
    position: absolute;
    top: 1.1458rem;
    right: 1.5625rem;
    width: 6.7708rem;
    margin-left: -2.6042rem;
    z-index: 1;
    .circle {
      width: 6.7708rem;
      height: 5.9375rem;
      //   margin-top: 1.1458rem;
      border: 5px solid #c0c4cc;
      border-radius: 0 30% 30% 0;
      border-left: none;
      // &amp;.finish {
      // 	border-color: #409eff;
      // }
    }
  }
  // :deep(.el-step__icon ){
  //   background: #f6f6f6;
  // }
  //   :deep(.el-step__icon-inner) {
  //     font-size: 1.875rem;
  //   }
  //   :deep(.el-step__line) {
  //     background: transparent;
  //     border-top: 5px solid;
  //     .el-step__line-inner {
  //       border-width: 0 !important;
  //     }
  //   }

  .el-steps {
    height: 8.25rem;
  }

  :deep(.el-step) {
    position: relative;
    margin: 10px 0;
    .el-step__head.is-process {
      color: #c0c4cc;
      border-color: #c0c4cc;
    }
    .el-step__title.is-process {
      color: #c0c4cc;
      font-weight: unset;
    }
  }
}
</style>
