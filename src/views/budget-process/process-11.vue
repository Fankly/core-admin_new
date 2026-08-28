<template>
  <div class="frameContract" v-loading="loading" element-loading-text="正在从服务器获取数据.....">
    <div class="topBox">
      <div class="title">
        <div class="titleBox">
          <h2>通用服务执行明细表</h2>
        </div>
        <div class="searchBox">
          <span style="margin-right: 20px">
            <span class="searchShow" v-if="searchShow == false" @click="showSearch(true)">
              <i style="font-size: 18px" class="el-icon-arrow-down"></i>
            </span>
            <span class="searchShow" @click="showSearch(false)" v-else>
              <i style="font-size: 18px" class="el-icon-arrow-up"></i>
            </span>
          </span>
          <span class="searchShow">
            <i style="font-size: 18px" class="el-icon-question" @click="helpHandle"></i>
          </span>
        </div>
      </div>

      <div class="search" v-show="searchShow">
        <el-form label-position="left" label-width="110px">
          <el-row :gutter="24">
            <el-col :span="6">
              <el-form-item label="采购申请号:">
                <copyTextBox class="formWidth" ref="cgsqh"></copyTextBox>
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="采购订单号:">
                <copyTextBox class="formWidth" ref="cgddh"></copyTextBox>
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="需求上报日期：">
                <el-date-picker
                  v-model="dataList.sbMonth"
                  value-format="YYYY-MM-DD"
                  format="YYYY-MM-DD"
                  type="daterange"
                  :picker-options="pickerOptions0"
                  range-separator="至"
                ></el-date-picker>
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="经法合同编号:">
                <copyTextBox class="formWidth" ref="jfhtbhkj"></copyTextBox>
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="24">
            <el-col :span="6">
              <el-form-item label="项目类型：">
                <projectType class="formWidth" ref="type"></projectType>
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="中标日期：">
                <el-date-picker
                  v-model="dataList.zbMonth"
                  value-format="YYYY-MM-DD"
                  format="YYYY-MM-DD"
                  type="daterange"
                  :picker-options="pickerOptions0"
                  range-separator="至"
                ></el-date-picker>
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="经法合同名称:">
                <el-input class="formWidth" v-model="dataList.tmtmc1" />
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="所属单位：">
                <affiliatedUnit class="formWidth" ref="company"></affiliatedUnit>
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="24">
            <el-col :span="6">
              <el-form-item label="取值逻辑：">
                <el-switch v-model="remarks" active-text="开" inactive-text="关" @change="remarksbtn" />
              </el-form-item>
            </el-col>
            <el-col :span="6"></el-col>
            <el-col :span="6"></el-col>
            <el-col :span="6" class="btnPostion">
              <el-form-item>
                <el-button type="primary" icon="el-icon-search" @click="search">查 询</el-button>
                <el-button icon="el-icon-refresh-right" @click="reset">重 置</el-button>
                <el-button type="warning" icon="el-icon-download" @click="exportBtn">导 出</el-button>
              </el-form-item>
            </el-col>
          </el-row>
        </el-form>
      </div>
    </div>
    <el-table
      row-key="row_id"
      id="crTable"
      :key="tableKey"
      border
      :data="example"
      v-if="tableHeight"
      :height="tableHeight"
      @row-click="clickJump"
      style="width: 100%"
      :header-cell-style="{ 'text-align': 'center' }"
      :cell-style="{ 'text-align': 'center' }"
    >
      <el-table-column
        :width="item.width"
        :key="item.prop"
        v-for="item in dropCol"
        class-name="dropTableColumn"
        :prop="item.prop"
        :label="item.label"
      />
    </el-table>
    <el-pagination
      :current-page="page.current"
      background
      align="center"
      :page-sizes="[10, 20, 50, 100, 500]"
      :page-size="page.limit"
      :total="parseInt(page.total + '')"
      layout="total, sizes, prev, pager, next, jumper"
      @size-change="limitChangeHandle"
      @current-change="pageChangeHandle"
    ></el-pagination>
    <userDialog ref="userDialog" @loadCompany="loadCompany"></userDialog>
  </div>
</template>

<script>
import { defineComponent, reactive } from 'vue'
import baseService from '@/service/baseService'
import { ElMessage } from 'element-plus'
import projectType from '@/components/select/projectType.vue'
import affiliatedUnit from '@/components/select/affiliatedUnit.vue'
import copyTextBox from '@/components/select/copyTextBox.vue'
import userDialog from '@/components/select/userDialog.vue'
import { useStore } from 'vuex'
import Sortable from 'sortablejs'
import { showHelpMsg } from '@/utils/message'
import { getConfigDetail } from '@/api/menu/menuConfig'
import { getMaxLength } from '@/utils/utils'

export default defineComponent({
  name: '/budget-process/process-11',
  components: {
    projectType,
    affiliatedUnit,
    copyTextBox,
    userDialog
  },
  setup() {
    const store = useStore()
    const helpHandle = () => {
      const url = store.getters.getMenuMsg.url
      showHelpMsg(url)
    }
    return reactive({
      tableKey: 0,
      store,
      helpHandle,
      remarks: false,
      example: [],
      dataList: {
        tmtmc1: '',
        sbMonth: '',
        zbMonth: ''
      },
      searchShow: true,
      page: {
        total: 0,
        limit: 10,
        page: 1,
        current: '1'
      },
      tableHeight: '',
      topHeight: '',
      heightNum: '',
      searchHeight: '',
      loading: false,
      userCode: '',
      userId: '',
      specialorgid: '',
      tableMsg: [],
      dropCol: [
        {
          label: '采购申请号',
          prop: 'banfn'
        },
        {
          label: '采购申请行项目号',
          prop: 'bnfpo'
        },
        {
          label: '合同类型(ECP)',
          prop: 'con_type'
        },
        {
          label: 'ERP框架协议号',
          prop: 'zebeln'
        },
        {
          label: '采购订单号',
          prop: 'ebeln'
        },
        {
          label: '采购订单行项目号',
          prop: 'ebelp'
        },
        {
          label: '经法合同编号',
          prop: 'zhtbh'
        },
        {
          label: '经法合同名称',
          prop: 'zhtmc1'
        },
        {
          label: '项目类型',
          prop: 'zprxmlx'
        },
        {
          label: '一级单位',
          prop: 'qkjyjdw_name'
        },
        {
          label: '二级单位',
          prop: 'qkjejdw_name'
        },
        {
          label: '需求上报日期',
          prop: 'zhzsj'
        },
        {
          label: '中标日期',
          prop: 'zzbsj'
        },
        {
          label: '招标金额',
          prop: 'zbje'
        },
        {
          label: '中标金额 ',
          prop: 'zhszj'
        },
        {
          label: '合同金额',
          prop: 'zhtje'
        },
        {
          label: '执行协议金额',
          prop: 'zzxhtje'
        },
        {
          label: '服务确认金额',
          prop: 'zzxhtqrje'
        },
        {
          label: '服务确认金额（不含税）',
          prop: 'zhtrzzje'
        }
      ]
    })
  },
  mounted() {
    this.tableKey = 0
    this.topHeight = document.querySelector('.topBox').clientHeight
    this.heightNum = document.querySelector('.el-card').clientHeight
    this.searchHeight = document.querySelector('.search').clientHeight
    this.setTableHeight()
    this.loading = true
    this.$refs.userDialog.getUser(this.userId, this.userCode)
    this.compTableWidth()
  },
  methods: {
    compTableWidth() {
      const tableData = this.example
      this.dropCol = this.dropCol.map((value) => {
        const arr = tableData.map((item) => {
          return item[value.prop]
        })
        arr.push(value.label)
        let width = getMaxLength(arr)
        if (value.prop === 'zhtmc1') {
          value.width = 320
        } else {
          value.width = Math.round(width + 20)
        }
        return value
      })
    },
    remarksbtn(val) {
      if (val) {
        getConfigDetail(this.store.getters.getMenuMsg.url).then((res) => {
          if (res.success) {
            if (res.data) {
              this.tableMsg = res.data
            }
          } else {
            ElMessage.error(res.msg)
          }
        })
      }
      this.loadData()
    },
    columnDrop() {
      const wrapperTr = document.getElementById('crTable').querySelector('.el-table__header-wrapper tr')
      const _this = this
      this.sortable = Sortable.create(wrapperTr, {
        animation: 180,
        delay: 0,
        draggable: '.dropTableColumn',
        onEnd: (evt) => {
          const oldItem = _this.dropCol[evt.oldIndex]
          _this.dropCol.splice(evt.oldIndex, 1)
          _this.dropCol.splice(evt.newIndex, 0, oldItem)
          _this.tableKey += 1
          this.$nextTick(() => {
            this.columnDrop()
          })
        }
      })
    },
    setTableHeight() {
      if (this.searchShow == true) {
        this.tableHeight = this.heightNum - this.topHeight - 80 + 'px'
      } else {
        this.tableHeight = this.heightNum - this.topHeight + this.searchHeight - 80 + 'px'
      }
    },
    loadData() {
      this.loading = true
      const params = {
        banfns: [],
        ebelns: [],
        szhzsj: '',
        ezhzsj: '',
        zhtbhs: [],
        zprxmlxs: [],
        szzbsj: '',
        ezzbsj: '',
        zhtmc1: this.dataList.tmtmc1,
        qkjejdws: [],
        page: this.page.page,
        limit: this.page.limit,
        specialorgid: this.specialorgid
      }

      params.ebelns = this.$refs.cgsqh.newArr //采购申请号
      params.banfns = this.$refs.cgddh.array //采购订单号
      //需求上报日期
      if (this.dataList.sbMonth) {
        params.szhzsj = this.dataList.sbMonth[0]
        params.ezhzsj = this.dataList.sbMonth[1]
      }
      params.zhtbhs = this.$refs.jfhtbhkj.array //经法合同编号
      params.zprxmlxs = this.$refs.type.selectList //项目类型
      //中标日期
      if (this.dataList.zbMonth) {
        params.szzbsj = this.dataList.zbMonth[0]
        params.ezzbsj = this.dataList.zbMonth[1]
      }
      params.qkjejdws = this.$refs.company.selectList //所属单位

      baseService.post('/process/process11/', params).then((res) => {
        if (res.success == true) {
          this.loading = false
          this.example = res.data.records
          if (this.remarks) {
            this.example.unshift(...this.tableMsg)
          }
          this.page.total = res.data.total
          this.compTableWidth()
        } else {
          this.loading = false
          ElMessage({
            type: 'error',
            message: res.msg
          })
        }
      })
    },
    exportBtn() {
      this.loading = true
      const params = {
        banfns: [],
        ebelns: [],
        szhzsj: '',
        ezhzsj: '',
        zhtbhs: [],
        zprxmlxs: [],
        szzbsj: '',
        ezzbsj: '',
        zhtmc1: this.dataList.tmtmc1,
        qkjejdws: [],
        page: this.page.page,
        limit: this.page.limit,
        specialorgid: this.specialorgid
      }

      params.ebelns = this.$refs.cgsqh.newArr //采购申请号
      params.banfns = this.$refs.cgddh.array //采购订单号
      //需求上报日期
      if (this.dataList.sbMonth) {
        params.szhzsj = this.dataList.sbMonth[0]
        params.ezhzsj = this.dataList.sbMonth[1]
      }
      params.zhtbhs = this.$refs.jfhtbhkj.array //经法合同编号
      params.zprxmlxs = this.$refs.type.selectList //项目类型
      //中标日期
      if (this.dataList.zbMonth) {
        params.szzbsj = this.dataList.zbMonth[0]
        params.ezzbsj = this.dataList.zbMonth[1]
      }
      params.qkjejdws = this.$refs.company.selectList //所属单位

      baseService.export('/process/process11/export', params).then((res) => {
        this.loading = false
        const blob = res
        let dom = document.createElement('a')
        let url = window.URL.createObjectURL(blob)
        dom.href = url
        dom.download = '通用服务执行明细表.xlsx'
        document.body.appendChild(dom)
        dom.click()
        document.body.removeChild(dom)
        window.URL.revokeObjectURL(url)
      })
    },
    clickJump(row) {
      if (row.zhtbh) {
        this.$router.push({
          path: '/budget-process/process-12',
          query: { banfn: row.banfn, bnfpo: row.bnfpo, specialorgid: this.specialorgid }
        })
      }
    },
    // 分页控件当前页修改事件
    pageChangeHandle(currentPageNum) {
      this.page.page = currentPageNum
      this.loadData()
    },
    // 分页控件请求数量修改事件
    limitChangeHandle(currentLimitNum) {
      this.page.limit = currentLimitNum
      this.loadData()
    },

    //搜索展示与隐藏
    showSearch(i) {
      this.searchShow = i
      this.setTableHeight()
    },

    //查询按钮
    search() {
      this.loadData()
    },

    //重置按钮
    reset() {
      this.remarks = false
      this.dataList.tmtmc1 = ''
      this.dataList.sbMonth = ''
      this.dataList.zbMonth = ''
      this.$refs.cgsqh.clear()
      this.$refs.cgddh.clear()
      this.$refs.type.clear()
      this.$refs.company.clear()
      this.$refs.jfhtbhkj.clear()
      this.example = []
      this.page.total = 0
      this.page.limit = 10
      this.page.page = 1
      this.page.current = '1'
      this.loadData()
    },
    loadCompany() {
      this.loading = false
      this.specialorgid = parseInt(this.$refs.userDialog.specialorgid)
      this.$refs.company.getAffiliatedUnit(this.specialorgid)
      this.columnDrop()
    }
  }
})
</script>

<style lang="less" scoped>
.frameContract {
  padding: 10px;

  .title {
    width: 100%;
    color: #00706b;
    display: flex;

    .titleBox {
      width: 50%;
      text-align: right;

      h2 {
        font-size: 16px;
        margin: 0;
        margin-bottom: 20px;
      }
    }

    .searchBox {
      width: 50%;
      text-align: right;

      .searchShow {
        cursor: pointer;
        color: #00706b;
        box-shadow: 0 0 0 0.3;
      }
    }
  }
}

:deep(.el-date-editor) {
  width: 100%;
}

:deep(.el-range-separator) {
  padding: 0;
}
</style>
