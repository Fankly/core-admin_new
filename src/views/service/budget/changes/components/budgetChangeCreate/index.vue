<template>
  <vxe-modal
    fullscreen
    :mask="true"
    :lock-scroll="true"
    :lock-view="true"
    show-zoom
    resize
    position="center"
    title="项目预算变更创建"
    v-model="isShowModal"
    width="80%"
    height="820"
  >
    <div class="content">
      <div class="operation">
        <el-button :disabled="loading" type="primary" plain @click="() => handleSaveData()">保 存</el-button>
        <el-button :disabled="loading || hasSelectedProjects" type="primary" plain @click="handleUploadFile">上传附件</el-button>
        <el-button :disabled="loading || hasSelectedProjects" type="primary" plain @click="handleDeleteFile">删除附件</el-button>
        <el-button :disabled="loading" type="primary" plain @click="handleSubmit">提 交</el-button>
        <el-button :disabled="loading" type="primary" plain @click="handleClose">关 闭</el-button>
      </div>
      <div class="table">
        <vxe-table
          keep-source
          height="auto"
          max-height="100%"
          :loading="loading"
          :checkbox-config="{
            trigger: 'row',
            highlight: true
          }"
          resizable
          :loading-config="{ icon: 'el-icon-loading', text: '正在加载...' }"
          :row-config="{ height: 32 }"
          border
          stripe
          show-overflow
          :edit-config="{ trigger: 'click', mode: 'cell', showStatus: true, beforeEditMethod }"
          :data="tableData"
          @cell-click="cellClickHandle"
          @checkbox-change="checkChangeHandle"
          @checkbox-all="checkChangeAllHandle"
          :cell-style="cellStyle"
          ref="tableRef"
        >
          <vxe-column align="center" :minWidth="55" type="checkbox"></vxe-column>
          <vxe-column headerAlign="center" :minWidth="220" field="xmmc" title="项目名称"></vxe-column>
          <vxe-column headerAlign="center" align="center" :minWidth="150" field="gwxmbm" title="国网项目编码"></vxe-column>
          <vxe-column
            headerAlign="center"
            align="right"
            :formatter="formatterHandle"
            :minWidth="150"
            field="ztzjh"
            title="总投资计划（万元）"
          ></vxe-column>
          <vxe-column
            headerAlign="center"
            align="right"
            :formatter="formatterHandle"
            :minWidth="150"
            field="allInvestTax"
            title="总预算含税（万元）"
          ></vxe-column>
          <vxe-column
            headerAlign="center"
            align="right"
            :formatter="formatterHandle"
            :minWidth="120"
            field="amount"
            title="项目总预算不含税（万元）"
          ></vxe-column>
          <vxe-column
            headerAlign="center"
            align="right"
            :formatter="formatterHandle"
            :minWidth="150"
            field="yearInvestTax"
            title="当年预算含税（万元）"
          ></vxe-column>
          <vxe-column
            headerAlign="center"
            align="right"
            :formatter="formatterHandle"
            :minWidth="126"
            field="dnys"
            title="当年预算不含税（万元）"
          ></vxe-column>
          <vxe-column
            headerAlign="center"
            align="right"
            :formatter="formatterHandle"
            :minWidth="150"
            field="dntzjh"
            title="当年投资计划（万元）"
          ></vxe-column>
          <vxe-column
            headerAlign="center"
            align="right"
            :formatter="formatterHandle"
            :minWidth="150"
            field="dncwzc"
            title="当年财务支出（万元）"
          ></vxe-column>
          <vxe-column
            :edit-render="{ name: 'input', autofocus: '.my-input', autoselect: true }"
            headerAlign="center"
            align="right"
            :formatter="formatterHandle"
            :minWidth="150"
            field="bgAmount"
            title="调整后总预算不含税（万元）"
          >
            <template #edit="{ row }">
              <input
                @input="() => handleInput(row, 'bgAmount')"
                :min="0"
                v-number-input="6"
                class="my-input"
                v-model="row['bgAmount']"
                maxlength="20"
              />
            </template>
          </vxe-column>
          <vxe-column
            :edit-render="{ name: 'input', autofocus: '.my-input', autoselect: true }"
            headerAlign="center"
            align="right"
            :formatter="formatterHandle"
            :minWidth="158"
            field="bgDnys"
            title="调整后当年预算不含税（万元）"
          >
            <template #edit="{ row }">
              <input @input="() => handleInput(row, 'bgDnys')" :min="0" v-number-input="6" class="my-input" v-model="row['bgDnys']" maxlength="20" />
            </template>
          </vxe-column>
          <vxe-column headerAlign="center" align="center" :minWidth="220" field="attachName" title="变更说明附件">
            <template #default="{ row }">
              <el-button @click="() => handleDownloadAttach(row)" type="text">{{ row['attachName'] }}</el-button>
            </template>
          </vxe-column>
          <vxe-column headerAlign="center" align="center" :minWidth="150" field="sfztMc" title="预算释放状态"></vxe-column>
          <vxe-column headerAlign="center" align="center" :minWidth="150" field="nd" title="年份"></vxe-column>
          <vxe-column
            :edit-render="{ name: 'input', autofocus: '.my-sbsm', autoselect: true }"
            headerAlign="center"
            :minWidth="380"
            field="bgyy"
            title="原因说明"
          >
            <template #edit="{ row }">
              <input class="my-sbsm" maxlength="127" v-model="row['bgyy']" />
            </template>
          </vxe-column>
        </vxe-table>
      </div>
    </div>
  </vxe-modal>
</template>

<script lang="ts">
import { defineComponent, ref, computed } from 'vue'
import { formatValue } from '@/utils/utils'
import { AcceptParams, BudgetChangeCreateRowVo } from '@/views/service/budget/changes/interface'
import { getYsbgByXmId, saveData, submitWf } from '@/api/service/budget'
import { ElMessage, ElMessageBox } from 'element-plus'
import baseService from '@/service/baseService'
import VXETable from 'vxe-table'
import Decimal from 'decimal.js'
import { downloadAttach, getBqshFlag } from '@/api/service/requirement'
import { getParamConfig, getParamValueMulti } from '@/api/common'
import { useStore } from 'vuex'
import { submitWorkflow, WFData, WFParam, WFUserInfo } from '@/hooks/useWorkflow'

const handleError = (error: Error, message = '操作失败'): void => {
  console.error(`${message}`, error)
  ElMessage({
    message: `${message}:${error.message}`,
    type: 'error',
    duration: 5000
  })
}

export default defineComponent({
  name: 'budgetChangeCreate',
  setup(props, { expose }) {
    const tableRef = ref()
    const parameter = ref<AcceptParams>({
      searchPage: null,
      sfgmb: '',
      selectedRowData: [],
      limitNum: 50,
      publicParams: {
        bmId: '',
        nd: '',
        xmlxId: '-1',
        dwId: '',
        userId: '',
        specialorgcode: '',
        fqzz: '',
        spRoleId: ''
      }
    })
    const isShowModal = ref(false)
    const store = useStore()
    const isProvinceSb = ref('')
    const ysbgSwitchType = ref<any>()
    const ysbgSwitch = ref<string>('')
    const loading = ref(false)
    const checkedData = ref<BudgetChangeCreateRowVo[]>([])
    const hasSelectedProjects = computed(() => checkedData.value && checkedData.value.length === 0)
    const formatterHandle = ({ cellValue }: any) => {
      if (typeof cellValue === 'undefined' || cellValue === null || cellValue === '') return '-'
      return formatValue(cellValue, 6)
    }
    const tableData = ref<BudgetChangeCreateRowVo[]>([])
    const isScalePackageAdjustment = computed(() => parameter.value.sfgmb === '1')
    const isBgAmountEditable = (row: BudgetChangeCreateRowVo) => String(row.ysbgSfkyxgztz) === '1'

    const getTableData = async (ids: string[]) => {
      try {
        loading.value = true
        tableData.value = []
        const res = await getYsbgByXmId(ids)
        if (res.success) {
          tableData.value = res.data as BudgetChangeCreateRowVo[]
        } else {
          ElMessage.error(res.msg)
        }
      } catch (e) {
        handleError(e as Error, '获取表格数据失败')
      } finally {
        loading.value = false
      }
    }

    const acceptParams = (params: AcceptParams) => {
      parameter.value = { ...parameter.value, ...params }
      const ids = params.selectedRowData.map((item) => item.xmid)
      getTableData(ids)
      isShowModal.value = true
    }

    const checkChangeHandle = ({ records }: any) => {
      checkedData.value = records
    }
    const checkChangeAllHandle = ({ records }: any) => {
      checkedData.value = records
    }

    const cellClickHandle = async ({ row, column }: any) => {
      if (column.type === 'checkbox') return
      checkedData.value = []
      await tableRef.value.clearCheckboxRow()
      await tableRef.value.setCheckboxRow(row, true)
      checkedData.value.push(row)
    }

    const wfParam = ref<WFParam>({
      XMIDS: '',
      FQBM: '',
      FQZZ: ''
    })

    const handleSubmit = async () => {
      try {
        // 校验表格数据是否已修改但未保存
        const $table = tableRef.value
        if ($table) {
          const { updateRecords } = $table.getRecordset()
          if (updateRecords && updateRecords.length > 0) {
            ElMessage({
              message: '表格数据已修改，请先保存后再提交！',
              type: 'warning'
            })
            return
          }
        }
        // 获取数据
        const multipleParams = await getParamValueMulti([
          'YSBZ_SWITCH',
          'YSBZ_SWITCH_TYPE',
          'YSSF_SWITCH',
          'YSSF_SWITCH_TYPE',
          'YSBG_SWITCH',
          'YSBG_SWITCH_TYPE',
          'YSSF_ADDTYPE'
        ])
        if (multipleParams.success) {
          const data = multipleParams.data
          ysbgSwitch.value = data['YSBG_SWITCH']
          if (data['YSBG_SWITCH_TYPE'] === 'ALL') {
            ysbgSwitchType.value = data['YSBG_SWITCH_TYPE']
          } else {
            let type_arr = data['YSBG_SWITCH_TYPE'].split(',')
            let dict = []
            for (let index = 0; index < type_arr.length; index++) {
              if (type_arr[index].split('@').length === 2) {
                dict[type_arr[index].split('@')[0]] = type_arr[index].split('@')[1]
              }
            }
            ysbgSwitchType.value = dict
          }
        }
        const limitNum = parameter.value.limitNum
        const publicParams = parameter.value.publicParams
        if ($table) {
          //   获取修改的数据
          let records: BudgetChangeCreateRowVo[] = []
          const { tableData } = $table.getTableData()
          records = tableData
          if (records.length === 0) {
            ElMessage({
              message: '请至少选择一个项目',
              type: 'warning'
            })
            return
          }
          // const isCurNd = rec
          if (records.length > limitNum) {
            ElMessage({
              message: `提交审核的项目数量应小于${limitNum}条`,
              type: 'warning'
            })
            return
          }
          const resultEjflData = await getParamConfig('YSBG_WXSGSSP')
          const ejflData = resultEjflData.data
          const startEjfl = (records[0].ejfl || '').substr(0, 2)
          if (ejflData.indexOf(startEjfl) != -1) {
            isProvinceSb.value = '1' // 不经过省公司审批
          } else {
            isProvinceSb.value = '0' // 经过省公司审批
          }
          for (var i = 0; i < records.length; i++) {
            if (i != 0) {
              if (ejflData.indexOf((records[i].ejfl || '').substr(0, 2)) != -1) {
                if (isProvinceSb.value != '1') {
                  ElMessage({
                    message: `以下项目存在走省公司审批和只走地市公司审批，请分开提交！`,
                    type: 'warning'
                  })
                  return
                }
              } else {
                if (isProvinceSb.value != '0') {
                  ElMessage({
                    message: `以下项目存在走省公司审批和只走地市公司审批，请分开提交！`,
                    type: 'warning'
                  })
                  return
                }
              }
            }
            // 判断项目关闭流程中，不可做预算变更
            if (records[i].gbdkShStatus === '01') {
              ElMessage({
                message: `国网项目编码为${records[i].gwxmbm}的项目处于项目关闭流程中，不可做预算变更!`,
                type: 'warning'
              })
              return
            }
            // 预算编制功能关闭;（规模包调整维持原状，不做此拦截）
            if (!isScalePackageAdjustment.value && ysbgSwitch.value === '02') {
              const switch_type = ysbgSwitchType.value[records[i].proType]
              if (ysbgSwitchType.value === 'ALL') {
                ElMessage({
                  message: `项目预算变更功能已关闭，不能释放！`,
                  type: 'warning'
                })
                return
              }
              if (switch_type != undefined) {
                ElMessage({
                  message: `${switch_type}的项目预算变更功能已关闭，不能释放！`,
                  type: 'warning'
                })
                return
              }
            }
            // if (records[i].sfzt === '0' || records[i].sfzt === '3') {
            //   ElMessage({
            //     message: `已释放或取消释放中的项目不可提交审核！`,
            //     type: 'warning'
            //   })
            //   return
            // }
            if (!records[i].attachName) {
              ElMessage({
                message: `存在变更项目总预算的记录，请先上传附件再提交审核！`,
                type: 'warning'
              })
              return
            }
          }
          try {
            await ElMessageBox.confirm(`确定进行提交审核吗?`, `确认操作`, {
              confirmButtonText: '确定',
              cancelButtonText: '取消',
              type: 'warning'
            })
            loading.value = false
            try {
              // 调用提交接口
              const wfUserInfo: WFUserInfo = {
                userId: store.getters.getUserMsg.id,
                spOrgId: publicParams.bmId || '',
                spRoleId: publicParams.spRoleId || ''
              }
              let xmIds = records.map((item) => item.xmid).join(',')
              const getDataRes = await getBqshFlag(xmIds, publicParams.dwId || '')
              if (getDataRes.success) {
                wfParam.value.XMIDS = xmIds || ''
                wfParam.value.SFGMB = parameter.value.sfgmb || ''
                wfParam.value.DWLX = getDataRes.data.DWLX || ''
                wfParam.value.XMLX = isProvinceSb.value || ''
                wfParam.value.FQZZ = publicParams.fqzz //市县 CITY OR COUNTY
                wfParam.value.FQBM = publicParams.specialorgcode === 'BM_CWZC' ? 'CWB' : 'YWB' //CWB
                submitWorkflow(store.getters.getUserMsg.systemCode, 'WF_MISXMYSBGLC', '', wfUserInfo, wfParam.value, {}, submitWFCallback)
              }
            } catch (e) {
              handleError(e as Error, '提交失败')
            }
          } catch (e) {
            console.log('用户取消了')
          }
        }
      } catch (e) {
        handleError(e as Error, '提交操作失败')
        loading.value = false
      }
    }

    const submitWFCallback = async (nextPersonAndPath: string, wfData: WFData) => {
      try {
        const $table = tableRef.value
        if ($table) {
          const { tableData } = $table.getTableData()
          const publicParams = parameter.value.publicParams
          loading.value = true
          let spfrom = {
            userId: store.getters.getUserMsg.id,
            spOrgId: publicParams.bmId || '',
            spRoleId: publicParams.spRoleId,
            sfgmb: parameter.value.sfgmb || '',
            wfCode: 'WF_MISXMYSBGLC',
            wfData: wfParam.value,
            bgData: tableData,
            nextPersonAndPath: nextPersonAndPath
          }
          const res = await submitWf({
            ...spfrom
          })
          if (res.success) {
            loading.value = false
            ElMessage.success('提交成功')
            // 刷新页面
            isShowModal.value = false
            if (parameter.value && parameter.value.searchPage) parameter.value.searchPage()
          } else {
            throw new Error(res.msg)
          }
        }
      } catch (e) {
        handleError(e as Error, '提交工作流操作失败')
      } finally {
        loading.value = false
      }
    }

    const handleDeleteFile = async () => {
      try {
        const $table = tableRef.value
        if ($table) {
          const recordDatas: BudgetChangeCreateRowVo[] = $table.getCheckboxRecords()
          if (recordDatas.length === 0) {
            ElMessage.warning('请选择要删除附件的项目!')
            return
          }
          const records = recordDatas.filter((item) => item.uuid)
          const type = await VXETable.modal.confirm('是否删除附件？', '提示', {
            confirmButtonText: '是',
            cancelButtonText: '否'
          })
          if (type === 'confirm') {
            records.forEach((record: BudgetChangeCreateRowVo) => {
              record.uuid = ''
              record.attachName = ''
            })
            handleSaveData('附件删除成功!', '1')
          }
        }
      } catch (e) {
        handleError(e as Error, '文件删除失败')
      } finally {
        loading.value = false
      }
    }

    const handleUploadFile = async () => {
      try {
        const $table = tableRef.value
        if ($table) {
          const records: BudgetChangeCreateRowVo[] = $table.getCheckboxRecords()
          if (records.length === 0) {
            ElMessage.warning('请至少选择一条要上传附件的项目!')
            return
          }
          let haveAttachFlag = false
          for (let i = 0; i < records.length; i++) {
            const record = records[i]
            if (record.bgid === '' || record.bgid === null) {
              ElMessage.warning('请先编辑并保存记录，再上传附件！')
              return
            }
            if (record.uuid) {
              haveAttachFlag = true
            }
          }
          if (haveAttachFlag) {
            const type = await VXETable.modal.confirm('部分变更项目已经存在附件，是否覆盖已有的附件？', '提示', {
              confirmButtonText: '是',
              cancelButtonText: '否'
            })
            if (type !== 'confirm') {
              return
            }
          }
          const types = ['doc', 'docx', 'xls', 'xlsx', 'rar', 'zip', 'txt', 'cab', 'pdf', 'ceb']
          const { files } = await $table.readFile({ multiple: false })
          const formData = new FormData()
          let attatchName = ''
          Array.from(files).map((file: any) => {
            const ns = file.name.split('.')
            const type = ns[ns.length - 1].toLowerCase()
            attatchName = file.name
            if (!types.includes(type)) throw new Error('文件只支持' + types.join(',') + '格式！')
            formData.append('files', file)
            formData.append('fileNames', attatchName)
          })
          loading.value = true
          //   上传文件
          const res = await baseService.post('/xmAttributeConfig/uploadAttach', formData)
          if (res.success) {
            records.forEach((record: BudgetChangeCreateRowVo) => {
              if (record.bgAmount === '' || record.bgAmount === null) {
                record.bgAmount = record.amount
              }
              if (record.bgDnys === '' || record.bgDnys === null) {
                record.bgDnys = record.dnys
              }
              record.uuid = res.data[0]
              record.attachName = attatchName
            })
            await handleSaveData('附件上传成功!', '1')
          } else {
            throw new Error(res.msg)
          }
        }
      } catch (e) {
        handleError(e as Error, '文件上传失败!')
      } finally {
        loading.value = false
      }
    }

    const handleDownloadAttach = async (row: BudgetChangeCreateRowVo) => {
      const uuid = row.uuid as string
      loading.value = true
      try {
        let res = await downloadAttach(uuid)
        const blob: any = res
        let dom = document.createElement('a')
        let url = window.URL.createObjectURL(blob)
        dom.href = url
        // 获取文件名
        if (res.headers) {
          let filename = row.attachName
          dom.download = `${decodeURI(decodeURI(filename))}`
          document.body.appendChild(dom)
          dom.click()
          document.body.removeChild(dom)
          window.URL.revokeObjectURL(url)
        }
      } catch (e) {
        handleError(e as Error, '下载附件失败')
      } finally {
        loading.value = false
      }
    }

    const handleClose = () => {
      checkedData.value = []
      isShowModal.value = false
    }

    const handleSaveData = async (tips = '保存成功！', flag = '2') => {
      try {
        const $table = tableRef.value
        if ($table) {
          //   获取修改的数据
          let tableDatas = []
          if (flag === '1') {
            tableDatas = $table.getCheckboxRecords()
          } else {
            const { tableData } = $table.getTableData()
            tableDatas = tableData
          }
          for (let i = 0; i < tableDatas.length; i++) {
            const record: BudgetChangeCreateRowVo = tableDatas[i]
            if (record.bgDnys === null || record.bgDnys === undefined || record.bgDnys === '') {
              if (parameter.value.sfgmb !== '1') {
                record.bgDnys = record.dnys
              } else {
                record.bgDnys = record.amount
              }
            }
            if (record.bgAmount === null || record.bgAmount === undefined || record.bgAmount === '') {
              record.bgAmount = record.amount
            }
          }
          const checkName: string[] = []
          if (parameter.value.sfgmb !== '1') {
            tableDatas.forEach((record: BudgetChangeCreateRowVo) => {
              const bgAmount = new Decimal(record.bgAmount || '0')
              const bgDnys = new Decimal(record.bgDnys || '0')
              if (-1 === bgAmount.comparedTo(bgDnys)) {
                checkName.push(record.xmmc)
              }
            })
            if (checkName.length !== 0) {
              const names = checkName.join(',')
              ElMessage.warning(`项目:(${names}):输入金额需满足，调整后总预算不含税（万元）应小于调整后当年预算不含税（万元）！`)
              return
            }
          }
          if (flag === '2') {
            const type = await VXETable.modal.confirm('确认是否保存?', '提示', {
              confirmButtonText: '是',
              cancelButtonText: '否'
            })
            if (type !== 'confirm') {
              return
            }
          }
          loading.value = true
          const res = await saveData({
            sfgmb: parameter.value.sfgmb,
            saveDatas: tableDatas
          })
          if (res.success) {
            ElMessage.success(tips)
            const ids = parameter.value.selectedRowData.map((item) => item.xmid)
            await getTableData(ids)
            if (parameter.value.searchPage) await parameter.value?.searchPage()
            checkedData.value = []
          } else {
            throw new Error(res.msg)
          }
        }
      } catch (e) {
        handleError(e as Error, '保存表格数据失败')
      } finally {
        loading.value = false
      }
    }

    const cellStyle = ({ row, column }: any) => {
      if (column.field === 'bgDnys' || (column.field === 'bgAmount' && (isScalePackageAdjustment.value || isBgAmountEditable(row)))) {
        return {
          borderBottom: '1px solid red',
          cursor: 'pointer'
        }
      }
    }

    const handleInput = (row: BudgetChangeCreateRowVo, flag: string) => {
      if (!isScalePackageAdjustment.value) return
      if (flag === 'bgAmount') {
        row.bgDnys = row.bgAmount
      }
      if (flag === 'bgDnys') {
        row.bgAmount = row.bgDnys
      }
    }

    // 控制单元格能否进入编辑：调整后总预算不含税列保留原有权限（规模包调整或 ysbgSfkyxgztz==='1' 才可编辑）
    const beforeEditMethod = ({ row, column }: any) => {
      if (column.field === 'bgAmount') {
        return isScalePackageAdjustment.value || isBgAmountEditable(row)
      }
      return true
    }

    expose({
      acceptParams
    })
    return {
      loading,
      handleInput,
      cellStyle,
      handleClose,
      isShowModal,
      beforeEditMethod,
      handleDownloadAttach,
      formatterHandle,
      handleSubmit,
      handleDeleteFile,
      handleUploadFile,
      handleSaveData,
      checkChangeHandle,
      checkChangeAllHandle,
      cellClickHandle,
      tableRef,
      hasSelectedProjects,
      tableData
    }
  }
})
</script>

<style scoped lang="less">
@import url(./index.less);
</style>
