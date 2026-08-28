<template>
  <!-- <base-scrollbar > -->
  <div class="projectView" :style="`${showScroll ? 'overflow: auto;height: 100%' : ''}`" :id="diffKey">
    <projectViewItem
      @onRerun="handleRerun"
      :show-sec="diffKey == 'diffText'"
      v-if="detailValue"
      :diffData="diffData"
      :dataValue="detailValue"
      :keyValues="KeyValues"
    >
      <template #baseInfo>
        <configText class="projectView__text" :options="InfoKeyValues" :dataValue="dataValue" />
      </template>
      <template #effectDataList>
        <table-box
          :height="getHeight(detailValue.effectDataList)"
          size="mini"
          ref="approvalBox"
          stripe
          :hasExtend="false"
          :data="detailValue.effectDataList"
        >
          <vxe-column type="seq" width="55px" title="序号" />
          <vxe-column width="120px" title="成效类型" field="effectId">
            <template #default="{ row }">
              <span class="vxe-cell--label">
                {{
                  formatLabel([row.effectId], tableBoxOptions.effectId, {
                    value: 'indicatorId',
                    label: 'indicatorName'
                  })
                }}
              </span>
            </template>
          </vxe-column>
          <vxe-column title="名称" field="name" :edit-render="{}">
            <template #default="{ row }">
              <span class="vxe-cell--label">{{ row.name }}</span>
            </template>
          </vxe-column>
          <!-- <vxe-column title="量化说明" field="descs" :edit-render="{ name: 'input' }" /> -->
        </table-box>
      </template>
      <template #calcProcessList>
        <table-box
          :height="getHeight(detailValue.calcProcessList)"
          size="mini"
          ref="approvalBox"
          stripe
          :hasExtend="false"
          :data="detailValue.calcProcessList"
        >
          <vxe-column field="seqNo" min-width="55px" title="序号" />
          <vxe-column field="categoryName" min-width="120px" title="项目类型">
            <template #default>
              <span class="vxe-cell--label">{{ dataValue?.categoryName }}</span>
            </template>
          </vxe-column>
          <!-- <vxe-column title="价格测算依据" min-width="15%"  field="calcId" >
              <template #default="{ row }">
                <span class="vxe-cell--label">{{ formatLabel([row.calcTplId], tableBoxOptions.calcTplId,  {value: 'itemId', label: 'name' }) }}</span>
              </template>
            </vxe-column> -->
          <vxe-column title="价格测算依据" min-width="120px" field="calcName">
            <template #default="{ row }">
              <!-- <span class="vxe-cell--label">{{ formatLabel([row.calcId], tableBoxOptions.calcId,  {value: 'basisId', label: 'basis' }) }}</span> -->
              <span class="vxe-cell--label">{{ row.calcName }}</span>
            </template>
          </vxe-column>
          <vxe-column title="费用名称" min-width="120px" field="costType">
            <template #default="{ row }">
              <span class="vxe-cell--label">{{ row.costType }}</span>
            </template>
          </vxe-column>
          <!-- <vxe-column title="费用名称" field="costName"   /> -->
          <vxe-column title="单位" min-width="80px" field="unitName" />
          <vxe-column title="单价(元)" min-width="80px" field="unitPrice" />
          <vxe-column title="数量" min-width="80px" field="quantity" />
          <vxe-column title="金额(万元)" min-width="80px" field="totalMoney">
            <template #default="{ row }">
              <span class="vxe-cell--label">{{ ((row.unitPrice * row.quantity) / 10000).toFixed(2) }}</span>
            </template>
          </vxe-column>
          <vxe-column title="计费说明" min-width="80px" field="remarks" />
          <vxe-column title="关联资产" min-width="80px" fixed="right">
            <template #default="{ row }">
              <el-link @click.prevent.stop="preview(row)" type="primary">查看</el-link>
            </template>
          </vxe-column>
        </table-box>
      </template>
      <!-- 关联附件功能已隐藏：注释掉附件展示插槽（包含附件下载链接列表） -->
      <!-- <template #attachment>
        <div class="text--item" :key="index" v-for="(item, index) in detailValue.attachment">
          <el-link @click="download(item.name)" type="info">{{ item.name }}</el-link>
          <span @click="download(item.name)" class="appendix"><i class="el-icon-download"></i></span>
        </div>
        <div v-if="detailValue.attachment && detailValue.attachment.length == 0"> 无 </div>
      </template> -->
      <template #history>
        <div class="projectView__history-row" :key="index" v-for="(item, index) in detailValue.history">
          <div class="text--item" style="flex: 0 0 auto; margin: 0 10px 0 0">
            <label>年份：</label>
            <span>{{ item.year }}</span>
          </div>
          <div class="text--item" style="flex: 0 0 auto; margin: 0 10px 0 0">
            <label>金额(万元)：</label>
            <span>{{ item.amount }}</span>
          </div>
          <!-- <div class="text--item" style="margin: 0;overflow: hidden;"> -->
          <!-- <label>情况描述：</label> -->
          <!-- <span>{{ item.desc }}</span> -->
          <!-- <span style="overflow: hidden;">
                <TextOverHiddenTooltip :text="item.desc" >
                </TextOverHiddenTooltip>
              </span> -->
          <!-- </div> -->
        </div>
        <div v-if="detailValue.history && detailValue.history.length == 0"> 无 </div>
      </template>
    </projectViewItem>
  </div>
  <vxe-modal
    v-model="assetPreviewVisible"
    title="关联资产"
    width="80vw"
    height="80vh"
    destroy-on-close
    resize
    show-zoom
    transfer
    :z-index="ASSET_PREVIEW_MODAL_Z_INDEX"
    position="center"
    :mask-closable="false"
    @close="handleAssetPreviewClose"
  >
    <projectManagerTransfer
      v-if="assetPreviewVisible"
      :key="assetPreviewKey"
      :readOnly="true"
      :selected="assetPreviewSelected"
      :observer="assetPreviewObserver"
      :getCheckTotalAmount="getPreviewCheckTotalAmount"
    />
  </vxe-modal>
  <!-- </base-scrollbar> -->
</template>
<script>
import configText from '@/views/finance/components/configText.vue'

import { DictionaryController, SysGlobalDictController } from '@/api'

import { CwProjectApply, CwProjectDiff, IndicatorManagement, FinanceCalculationBasis } from '@/api/mainController'

import projectViewItem from './projectViewItem.vue'

import projectManagerTransfer from '@/views/finance/projectList/projectManagerTransfer.vue'

// 关联附件功能已隐藏：download 方法被注释后 isImage 不再使用，一并注释其引入
// import { isImage } from '@/core/mixins'

const ASSET_PREVIEW_MODAL_Z_INDEX = 3010

export default {
  components: {
    projectViewItem,
    configText,
    projectManagerTransfer
  },
  props: {
    projectId: {
      type: [String, Number]
    },
    id: {
      type: String
    },
    diffKey: {
      type: String
    },
    diffData: {
      type: Object
    },
    showScroll: {
      type: Boolean
    }
  },
  name: 'projectView',
  data() {
    return {
      dataValue: undefined,
      detailValue: undefined,
      tableBoxOptions: {
        effectId: [],
        calcId: []
      },
      approvalList: [],
      rowHeight: 120,
      assetPreviewVisible: false,
      assetPreviewRow: null,
      assetPreviewSelected: [],
      assetPreviewKey: 0,
      ASSET_PREVIEW_MODAL_Z_INDEX
    }
  },
  created() {},
  mounted() {
    this.initFormData()
  },

  methods: {
    initFormData() {
      this.getIndicatorManagement()
      this.getCalcTplId()
      this.getFinanceCalculationBasis()
      this.getInfo()
    },
    preview(row) {
      if (!row) {
        return
      }
      this.assetPreviewRow = row
      this.assetPreviewSelected = Array.isArray(row.calculationDataAssetList) ? [...row.calculationDataAssetList] : []
      this.assetPreviewKey += 1
      this.assetPreviewVisible = true
    },
    handleAssetPreviewCancel(isSuccess = false, data) {
      if (isSuccess && this.assetPreviewRow) {
        this.assetPreviewRow.calculationDataAssetList = Array.isArray(data) ? data : []
      }
      this.handleAssetPreviewClose()
    },
    handleAssetPreviewClose() {
      this.assetPreviewVisible = false
      this.assetPreviewRow = null
      this.assetPreviewSelected = []
    },
    getPreviewCheckTotalAmount({ calculationDataAssetList = [] } = {}) {
      if (!this.dataValue || !this.detailValue) {
        return Promise.resolve({})
      }
      const calcProcessList = (this.detailValue.calcProcessList || []).map((item) =>
        item === this.assetPreviewRow ? { ...item, calculationDataAssetList } : item
      )
      const cwProjectDto = {
        applyTaxExclusive: this.dataValue?.applyTaxExclusive
      }
      const cwProjectApplyDto = {
        projectId: this.projectId,
        calcProcessList
      }
      return CwProjectApply.compareAmount(this, { cwProjectTbDto: { cwProjectDto, cwProjectApplyDto } }, null, { showMask: false }).then(
        (res) => res.data || {}
      )
    },
    formatLabel(list = [], options = [], props = { label: 'label', value: 'value' }) {
      if (list) {
        return list
          .map((value) => {
            const item = options.find((item) => item[props.value] === value)
            return item ? item[props.label] : value
          })
          .join(',')
      }
      return ''
    },
    // 获取指标成效
    getIndicatorManagement() {
      return IndicatorManagement.list(this, {
        indicatorManagementDtoFilter: {}
      }).then((res) => {
        if (res.data?.dataList.length > 0) {
          this.tableBoxOptions.effectId = [
            {
              indicatorId: 0,
              indicatorName: '其他'
            },
            ...res.data?.dataList
          ]
        }
      })
    },
    getCalcTplId() {
      let params = {
        dictCode: 'financeCalcTpl'
      }
      return SysGlobalDictController.listAll(this, params).then((res) => {
        if (res) {
          this.tableBoxOptions.calcTplId = [...res?.fullResultList?.filter((item) => item.status == 0)]
        }
      })
    },

    // 获取价格测算依据
    getFinanceCalculationBasis() {
      return FinanceCalculationBasis.list(this, {
        financeCalculationBasisDtoFilter: {}
      }).then((res) => {
        if (res.data?.dataList.length > 0) {
          this.tableBoxOptions.calcId = [
            {
              basisId: 1,
              basis: '询价',
              custom: true
            },
            {
              basisId: 2,
              basis: '历史经验往年费用',
              custom: true
            },
            {
              basisId: 3,
              basis: '自定义',
              custom: true
            },
            ...res.data?.dataList
          ]
        }
      })
    },
    // 关联附件功能已隐藏：附件下载方法暂时注释
    // download(filename) {
    //   const obj = {
    //     filename,
    //     projectId: this.projectId,
    //     fieldName: 'attachment',
    //     asImage: isImage(filename)
    //   }
    //   CwProjectApply.download(this, obj, 'get')
    // },
    highlightInElements(parentSelector, keyword, className = 'context') {
      if (keyword == null || keyword == '') {
        return
      }
      const parent = document.querySelector(parentSelector)
      if (!parent) return
      // const elements = parent.querySelectorAll('*:not(script):not(style)'); // 避免影响脚本和样式
      const elements = parent.querySelectorAll('.subtitle') // 避免影响脚本和样式
      elements.forEach((el) => {
        if (el.childNodes) {
          const regex = new RegExp(`(${keyword})`, 'gi')
          el.innerHTML = el.innerHTML.replace(regex, `<span class="${className}">$1</span>`)
        }
      })
    },
    clearHighlights(parentSelector, className = 'context') {
      const parent = document.querySelector(parentSelector)
      if (!parent) return

      // 找到所有带有高亮类名的元素，但排除带有 neglect__text 类的元素
      const highlightedElements = parent.querySelectorAll(`.${className}`)

      highlightedElements.forEach((span) => {
        // 跳过带有 neglect__text 类的元素（这是评分显示用的）
        if (span.classList.contains('neglect__text')) {
          return
        }
        // 创建一个文本节点，内容为高亮元素的原始文本
        const textNode = document.createTextNode(span.textContent)
        // 用文本节点替换高亮元素
        span.parentNode.replaceChild(textNode, span)
      })
    },
    clearDiff() {
      // this.clearHighlights(`.projectView#${this.diffKey}`)
    },
    handleRerun(item) {
      this.$emit('onRerun', item)
    },
    getDiff() {
      this.$nextTick(() => {
        if (this.dataValue && this.diffData) {
          setTimeout(() => {
            this.KeyValues.forEach((item) => {
              if (item && item.diffProp && item.diffProp != null) {
                const diffArrs = this.diffData[item.diffProp]
                if (diffArrs != null && diffArrs.length > 0) {
                  diffArrs.forEach((v) => {
                    this.highlightInElements(`.projectView#${this.diffKey} #${item.value}`, v[this.diffKey], undefined)
                  })
                }
              }
            })
          }, 0)
        }
      })
    },
    getInfo() {
      if (!this.projectId) return
      CwProjectApply.detailTb(this, {
        projectId: this.projectId
      }).then((res) => {
        const { cwProjectVo, cwProjectApplyVo } = res.data
        this.dataValue = cwProjectVo
        this.detailValue = {
          ...cwProjectApplyVo,
          history: JSON.parse(cwProjectApplyVo?.history || '[]')
          // 关联附件功能已隐藏：不再解析 attachment 字段
          // attachment: JSON.parse(cwProjectApplyVo?.attachment || '[]').reduce((arr, item) => [...arr, { name: item }], [])
        }
        this.$nextTick(() => {
          this.$emit('item-change')
          this.$emit('update:data', res.data)
        })
        this.getDiff()
      })
    },
    getHeight(val) {
      const minHeight = 44 + this.rowHeight // 最小高度
      const maxHeight = 400 // 最大高度
      const calculatedHeight = val.length * this.rowHeight + 44
      return Math.min(Math.max(calculatedHeight, minHeight), maxHeight)
    }
    // checkTotalAmount () {
    //   this.totalAmount = {}
    //   if (!this.theProjectId && this.detailValue?.calcProcessList.length == 0) {
    //     return;
    //   }
    //   const cwProjectDto = {
    //     applyTaxExclusive: this.dataValue?.applyTaxExclusive
    //   }
    //   const cwProjectApplyDto = {
    //     projectId: this.projectId,
    //     calcProcessList: this.detailVa9lue.calcProcessList
    //   }
    //   return CwProjectApply.compareAmount(this, { cwProjectTbDto: { cwProjectDto, cwProjectApplyDto } }, null, { showMask: false }).then((res) => {
    //     this.totalAmount = res.data;
    //   }).then(res => {
    //     this.$nextTick(() => {
    //       this.$refs.detailConfigBox.$refs.form.validateField('calcProcessList', (valid3) => { });
    //     })
    //   })
    // }
  },
  computed: {
    assetPreviewObserver() {
      return {
        cancel: this.handleAssetPreviewCancel
      }
    },
    InfoKeyValues() {
      return [
        {
          label: '归口部门',
          prop: 'affiliateDeptName'
        },
        {
          label: '二级单位',
          prop: 'secondDeptName'
        },
        {
          label: '实施部门',
          prop: 'implDept'
        },
        {
          label: '项目类型',
          prop: 'categoryName'
        },
        {
          label: '重点投向',
          prop: 'keyInvestName'
        },
        {
          label: '预算事项',
          prop: 'courseTitleName'
        },
        {
          label: '项目名称',
          prop: 'name'
        },
        {
          label: '申请总额(万元)',
          prop: 'applyTaxExclusive'
        },
        /*  {
          label: '招标方式',
          prop: 'biddingMethod',
          formatter: (value) => {
            if (value == null) return ''
            const map = {
              1: '框架招标',
              2: '单项招标',
              3: '无需招标'
            }
            return map[+value] || ''
          }
        }, */
        {
          label: '是否预安排',
          prop: 'preArranged',
          formatter: (value) => {
            return value != null ? (value == '1' ? '是' : '否') : ''
          }
        }
      ]
    },
    KeyValues() {
      return [
        {
          name: '基础信息',
          value: 'baseInfo',
          slot: true
        },
        {
          name: '实施背景',
          value: 'implBackground'
          // rateProp: 'totalImplBackground',
          // diffProp: 'diffImplBackgroundList',
          // secTextProp: 'reasonImplBackground',
          // secColorType: 'info'
        },
        {
          name: '实施内容',
          value: 'implContent',
          rateProp: 'totalImplContent',
          diffProp: 'diffImplContentList',
          secTextProp: 'reasonImplContent',
          showSec: true,
          secColorType: (diffData) => {
            // 根据 diffData 中的值动态判断颜色
            // 示例：可以根据 rateProp 的值或者其他字段判断
            const aiRiskLevel = diffData?.aiRiskLevel
            if (aiRiskLevel == 1) return 'danger'
            // if (rate >= 70) return 'warning';
            // if (rate >= 50) return 'info';
            return 'success'
          }
        },
        {
          name: '项目成效',
          value: 'effectDataList',
          // rateProp: 'totalProjectOutcome',
          // diffProp: 'diffProjectOutcomeList',
          slot: true
        },
        {
          name: '计算过程',
          value: 'calcProcess'
        },
        {
          name: '量价关系',
          value: 'calcProcessList',
          slot: true
        }
        // 关联附件功能已隐藏：从详情项配置中移除「关联附件」入口
        // {
        //   name: '关联附件',
        //   value: 'attachment',
        //   slot: true
        // },
        /* {
          name: '近3年费用',
          value: 'history',
          rateProp: 'totalHistory',
          diffProp: 'diffHistoryList',
          slot: true
        }, */
        /* this.detailValue.costDesc != null && this.detailValue.costDesc != ''
          ? {
              name: '费用补充说明',
              value: 'costDesc'
            }
          : null,
        this.detailValue.hasHistory == 0
          ? {
              name: '项目新增原因',
              value: 'newReason'
            }
          : null,
        {
          value: 'remark',
          name: '备注'
        } */
      ].filter((item) => item)
    }
  },
  watch: {
    projectId: {
      handler(val, oldVal) {
        if (val && oldVal && val != oldVal) {
          this.initFormData()
        }
      },
      deep: true
    },
    diffData: {
      handler(val, oldVal) {
        if (val && !oldVal) {
          this.getDiff()
        }
      },
      deep: true
    }
  }
}
</script>
<style lang="less" scoped>
.projectView {
  padding: 8px 10px 20px 8px;
  height: 100%;
  width: 100%;
  overflow: auto;
  &__history-row {
    display: flex;
    overflow: hidden;
  }
  .projectView__text {
    :deep(.subtitle) {
      height: 160px;
    }
    :deep(.configText__view--item) {
      flex: 0 0 calc(33.33% - 20px);
      margin-top: 10px;
      height: auto;
    }
  }
}

.appendix {
  margin-left: 5px;
  font-size: 16px;
  cursor: pointer;
  i {
    color: @color-primary;
  }
}

.projectView {
  :deep(.vxe-table-box) {
    height: auto !important;
    // height:auto!important;
    // max-height: 500px;
  }
}
</style>
