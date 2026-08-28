<template>
  <div class="running" v-loading="loading" element-loading-text="正在从服务器获取数据.....">
    <div class="topBox">
      <div class="title">
        <div class="titleBox">
          <h2>资金支付信息查询表</h2>
        </div>
        <div class="searchBox">
          <el-dropdown style="margin-right: 30px; cursor: pointer" trigger="click" :hide-on-click="false">
            <span class="el-dropdown-link">
              <el-icon style="font-size: 18px" class="el-icon-s-operation">
                <arrow-down />
              </el-icon>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item v-for="item in segment" :key="item.value">
                  <el-checkbox style="margin-right: 10px" v-model="item.checked" @change="listShow(item.value, item.checked)"></el-checkbox>
                  {{ item.label }}
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
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
        <el-form label-width="110px" label-position="left">
          <el-row :gutter="24">
            <el-col :span="6">
              <el-form-item label="项目定义号：">
                <copyTextBox class="formWidth" ref="pspid"></copyTextBox>
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="采购凭证：">
                <copyTextBox class="formWidth" ref="ebeln"></copyTextBox>
              </el-form-item>
            </el-col>

            <el-col :span="6">
              <el-form-item label="供应商：">
                <copyTextBox class="formWidth" ref="lifnr"></copyTextBox>
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="利润中心：">
                <copyTextBox class="formWidth" ref="prctr"></copyTextBox>
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="24">
            <el-col :span="6">
              <el-form-item label="付款申请单号：">
                <copyTextBox class="formWidth" ref="zsqdh"></copyTextBox>
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="创建日期：">
                <el-date-picker v-model="cjdat" type="date" placeholder="选择日期"> </el-date-picker>
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="支付日期：">
                <el-date-picker v-model="zzfrq" type="date" placeholder="选择日期"> </el-date-picker>
              </el-form-item>
            </el-col>
            <el-col :span="6" class="btnPostion">
              <el-form-item>
                <el-button type="primary" @click="loadData" icon="el-icon-search">查 询 </el-button>
                <el-button icon="el-icon-refresh-right" @click="reset">重 置</el-button>
                <el-button type="warning" icon="el-icon-download" @click="exportData">导 出</el-button>
              </el-form-item>
            </el-col>
          </el-row>
        </el-form>
      </div>
    </div>

    <el-table
      stripe
      border
      v-if="tableHeight"
      :height="tableHeight"
      :data="example"
      row-key="id"
      style="width: 100%; margin-top: 10px"
      :cell-style="{ 'text-align': 'center' }"
      :header-cell-style="{ 'text-align': 'center' }"
    >
      <el-table-column v-if="columnObj.prctr" width="200" prop="prctr" label="利润中心" />
      <el-table-column v-if="columnObj.ltext" width="200" prop="ltext" label="利润中心描述" />
      <el-table-column v-if="columnObj.pspid" width="200" prop="pspid" label="项目定义" />
      <el-table-column v-if="columnObj.post1" width="200" prop="post1" label="项目描述" />
      <el-table-column v-if="columnObj.ebeln" width="200" prop="ebeln" label="采购凭证">
        <template #default="scope">
          <a style="cursor: pointer" @click="jump(scope.row.id, scope.row.ebeln)">{{ scope.row.ebeln }}</a>
        </template>
      </el-table-column>
      <el-table-column v-if="columnObj.lifnr" width="200" prop="lifnr" label="供应商" />
      <el-table-column v-if="columnObj.name1" width="200" prop="name1" label="供应商名称" />
      <el-table-column v-if="columnObj.zhtbh" width="200" prop="zhtbh" label="合同编号" />
      <el-table-column v-if="columnObj.kpje" width="200" prop="kpje" label="开票金额" />
      <el-table-column v-if="columnObj.zysqje" width="200" prop="zysqje" label="已申请金额" />
      <el-table-column v-if="columnObj.zyfkje" width="200" prop="zyfkje" label="已付款金额" />
      <el-table-column v-if="columnObj.syksqje" width="200" prop="syksqje" label="剩余可申请金额" />
      <el-table-column v-if="columnObj.contracttitle" width="200" prop="contracttitle" label="合同名称" />
      <el-table-column v-if="columnObj.zhszj" width="200" prop="zhszj" label="合同金额" />
    </el-table>
    <el-pagination
      :current-page="page.page"
      background
      align="center"
      :page-sizes="[10, 20, 50, 100, 500]"
      :page-size="page.limit"
      :total="parseInt(page.total + '')"
      layout="total, sizes, prev, pager, next, jumper"
      @size-change="limitChangeHandle"
      @current-change="pageChangeHandle"
    ></el-pagination>
  </div>
  <el-dialog title="资金支付信息查询表(穿透)" v-model="dialogVisible" width="80%">
    <el-table
      stripe
      :height="tableHeight"
      border
      :data="dialogExample"
      row-key="id"
      style="width: 100%; margin-top: 10px"
      :cell-style="{ 'text-align': 'center' }"
      :header-cell-style="{ 'text-align': 'center' }"
    >
      <el-table-column label="单据类型" prop="ztype" width="250"></el-table-column>
      <el-table-column label="付款申请单号" prop="zsqdh" width="250"></el-table-column>
      <el-table-column label="序号" prop="zsqxh" width="250"></el-table-column>
      <el-table-column label="采购凭证" prop="ebeln" width="250"></el-table-column>
      <el-table-column label="发票凭证号" prop="belnr" width="250"></el-table-column>
      <el-table-column label="发票凭证号年度" prop="gjahrFp" width="250"></el-table-column>
      <el-table-column label="发票凭证行" prop="buzei" width="250"></el-table-column>
      <el-table-column label="付款申请公司代码" prop="bukrs2" width="250"></el-table-column>
      <el-table-column label="项目定义" prop="pspid" width="250"></el-table-column>
      <el-table-column label="单据状态" prop="zstate" width="250"></el-table-column>
      <el-table-column label="删除标识" prop="zdel" width="250"></el-table-column>
      <el-table-column label="付款类型" prop="zfklx" width="250"></el-table-column>
      <el-table-column label="申请说明" prop="zsqsm" width="250"></el-table-column>
      <el-table-column label="创建日期" prop="cjdat" width="250"></el-table-column>
      <el-table-column label="当前审批环节" prop="zspstate" width="250"></el-table-column>
      <el-table-column label="处理日期" prop="modifydate" width="250"></el-table-column>
      <el-table-column label="申请人" prop="afnam" width="250"></el-table-column>
      <el-table-column label="申请金额" prop="zsqje" width="250"></el-table-column>
      <el-table-column label="供应商" prop="lifnr" width="250"></el-table-column>
      <el-table-column label="供应商名称" prop="name1" width="250"></el-table-column>
      <el-table-column label="供应商银联号" prop="bankl" width="250"></el-table-column>
      <el-table-column label="银行名称" prop="banka" width="250"></el-table-column>
      <el-table-column label="供应商账户" prop="bankn" width="250"></el-table-column>
      <el-table-column label="供应商户主名称" prop="koinh" width="250"></el-table-column>
      <el-table-column label="合同编号" prop="zhtbh" width="250"></el-table-column>
      <el-table-column label="付款方利润中心" prop="zfkprctr" width="250"></el-table-column>
      <el-table-column label="付款方公司代码" prop="zfkbukrs" width="250"></el-table-column>
      <el-table-column label="付款方银联号" prop="zfkbankl" width="250"></el-table-column>
      <el-table-column label="付款方银行名称" prop="zfkbanka" width="250"></el-table-column>
      <el-table-column label="付款方银行帐户" prop="fkfzfzh" width="250"></el-table-column>
      <el-table-column label="付款凭证公司代码" prop="zbukrs" width="250"></el-table-column>
      <el-table-column label="付款凭证" prop="augbl" width="augbl"></el-table-column>
      <el-table-column label="会计年度" prop="gjahr" width="250"></el-table-column>
      <el-table-column label="排程日期" prop="zjrpc" width="250"></el-table-column>
      <el-table-column label="排程状态" prop="zpcfk" width="250"></el-table-column>
      <el-table-column label="利润中心" prop="prctr" width="250"></el-table-column>
      <el-table-column label="利润中心描述" prop="ltext" width="250"></el-table-column>
      <el-table-column label="项目描述" prop="post1" width="250"></el-table-column>
      <el-table-column label="开票金额" prop="kpje" width="250"></el-table-column>
      <el-table-column label="已申请金额" prop="zysqje" width="250"></el-table-column>
      <el-table-column label="已付款金额" prop="zyfkje" width="250"></el-table-column>
      <el-table-column label="申请人姓名" prop="zname" width="250"></el-table-column>
      <el-table-column label="支付日期" prop="zzfrq" width="250"></el-table-column>
      <el-table-column label="合同名称" prop="contracttitle" width="250"></el-table-column>
      <el-table-column label="合同金额" prop="zhszj" width="250"></el-table-column>
    </el-table>
    <div class="pagina">
      <el-pagination
        :current-page="page.dialogPage"
        background
        align="center"
        :page-sizes="[5, 10, 15, 20]"
        :page-size="page.dialogLimit"
        :total="parseInt(page.dialogTotal + '')"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="dialogLimitChangeHandle"
        @current-change="dialogPageChangeHandle"
      ></el-pagination>
    </div>
  </el-dialog>
  <userDialog ref="userDialog" @loadCompany="loadCompany"></userDialog>
</template>

<script>
import { defineComponent, reactive } from 'vue'
import baseService from '@/service/baseService'
import { ElMessage } from 'element-plus'
import copyTextBox from '@/components/select/copyTextBox.vue'
import userDialog from '@/components/select/userDialog.vue'
import { useStore } from 'vuex'
import { showHelpMsg } from '@/utils/message'

export default defineComponent({
  name: '/budget-process/process-39',
  components: {
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
      store,
      helpHandle,
      page: {
        total: 0,
        limit: 10,
        page: 1,
        current: '1',
        dialogTotal: 0,
        dialogLimit: 5,
        dialogPage: 1,
        dialogCurrent: '1'
      },
      searchShow: true,
      segment: [
        {
          value: 'prctr',
          label: '利润中心',
          checked: true
        },
        {
          value: 'ltext',
          label: '利润中心描述',
          checked: true
        },
        {
          value: 'pspid',
          label: '项目定义',
          checked: true
        },
        {
          value: 'post1',
          label: '项目描述',
          checked: true
        },
        {
          value: 'ebeln',
          label: '采购凭证',
          checked: true
        },
        {
          value: 'lifnr',
          label: '供应商',
          checked: true
        },
        {
          value: 'name1',
          label: '供应商名称',
          checked: true
        },
        {
          value: 'zhtbh',
          label: '合同编号',
          checked: true
        },
        {
          value: 'kpje',
          label: '开票金额',
          checked: true
        },
        {
          value: 'zysqje',
          label: '已申请金额',
          checked: true
        },
        {
          value: 'zyfkje',
          label: '已付款金额',
          checked: true
        },
        {
          value: 'syksqje',
          label: '剩余可申请金额',
          checked: true
        },
        {
          value: 'contracttitle',
          label: '合同名称',
          checked: true
        },
        {
          value: 'zhszj',
          label: '合同金额',
          checked: true
        }
      ],
      example: [],
      zzfrq: '',
      cjdat: '',
      tableHeight: '',
      topHeight: '',
      heightNum: '',
      searchHeight: '',
      loading: false,
      userCode: '',
      userId: '',
      dialogExample: [],
      specialorgid: '',
      dialogVisible: false,
      columnObj: {},
      dialogId: '',
      dialogCode: ''
    })
  },
  mounted() {
    this.handleColumn()
    this.topHeight = document.querySelector('.topBox').clientHeight
    this.heightNum = document.querySelector('.el-card').clientHeight
    this.searchHeight = document.querySelector('.search').clientHeight
    this.setTableHeight()
    this.loading = true
    this.$refs.userDialog.getUser()
  },
  methods: {
    dialogPageChangeHandle(currentPageNum) {
      this.page.dialogPage = currentPageNum
      this.jump(this.dialogId, this.dialogCode)
    },
    dialogLimitChangeHandle(currentLimitNum) {
      this.page.dialogPage = 1
      this.page.dialogLimit = currentLimitNum
      this.jump(this.dialogId, this.dialogCode)
    },
    pageChangeHandle(currentPageNum) {
      this.page.page = currentPageNum
      this.loadData()
    },
    limitChangeHandle(currentLimitNum) {
      this.page.page = 1
      this.page.limit = currentLimitNum
      this.loadData()
    },
    loadCompany() {
      this.loading = false
      this.specialorgid = parseInt(this.$refs.userDialog.specialorgid)
    },
    //项目环节
    listShow(value, checked) {
      for (let i in this.columnObj) {
        if (i == value) {
          this.columnObj[i] = checked
        }
      }
    },
    jump(id, code) {
      this.dialogId = id
      this.dialogCode = code
      baseService
        .post('/process37/ct', {
          ebeln: code,
          page: this.page.dialogPage,
          limit: this.page.dialogLimit
        })
        .then((res) => {
          if (res.success) {
            this.dialogExample = res.data.records
            this.page.dialogTotal = res.data.total
            this.dialogVisible = true
          } else {
            this.loading = false
            ElMessage({
              type: 'error',
              message: res.msg
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
    //处理环节数据
    handleColumn() {
      this.segment.forEach((item) => {
        this.columnObj[item.value] = item.checked
      })
    },
    formatDate(date) {
      let time = new Date(date)
      let zyear = time.getFullYear()
      let zmonth = time.getMonth() + 1
      let zday = time.getDate()
      return JSON.stringify(zyear) + JSON.stringify(zmonth).padStart(2, '0') + JSON.stringify(zday).padStart(2, '0')
    },
    //搜索按钮
    loadData() {
      this.loading = true
      let cjdatNew = ''
      let zzfrqnew = ''
      if (this.cjdat) {
        cjdatNew = this.formatDate(this.cjdat)
      }
      if (this.zzfrq) {
        zzfrqnew = this.formatDate(this.zzfrq)
      }
      const params = {
        specialorgid: this.specialorgid,
        page: this.page.page,
        limit: this.page.limit,
        pspids: this.$refs.pspid.array,
        ebelns: this.$refs.ebeln.array,
        lifnrs: this.$refs.lifnr.array,
        prctrs: this.$refs.prctr.array,
        zsqdhs: this.$refs.zsqdh.array,
        cjdat: cjdatNew,
        zzfrq: zzfrqnew
      }
      baseService.post('/process37/', params).then((res) => {
        if (res.success) {
          this.loading = false
          this.example = res.data.records
          this.page.total = res.data.total
        } else {
          this.loading = false
          ElMessage({
            type: 'error',
            message: res.msg
          })
        }
      })
    },

    //重置按钮
    reset() {
      this.page.page = 1
      this.page.limit = 10
      this.page.total = 0
      this.$refs.pspid.clear()
      this.$refs.ebeln.clear()
      this.$refs.lifnr.clear()
      this.$refs.prctr.clear()
      this.$refs.zsqdh.clear()
      this.cjdat = ''
      this.zzfrq = ''
      // 清楚搜索条件
      this.example = []
      this.loadData()
    },

    //搜索展示与隐藏
    showSearch(i) {
      this.searchShow = i
      this.setTableHeight()
    },

    // 数据导出
    exportData() {
      this.loading = true
      let cjdatNew = ''
      let zzfrqnew = ''
      if (this.cjdat) {
        cjdatNew = this.formatDate(this.cjdat)
      }
      if (this.zzfrq) {
        zzfrqnew = this.formatDate(this.zzfrq)
      }
      const params = {
        specialorgid: this.specialorgid,
        cjdat: cjdatNew,
        ebelns: this.$refs.ebeln.array,
        lifnrs: this.$refs.lifnr.array,
        page: this.page.page,
        limit: this.page.limit,
        prctrs: this.$refs.prctr.array,
        pspids: this.$refs.pspid.array,
        zsqdhs: this.$refs.zsqdh.array,
        zzfrq: zzfrqnew
      }
      baseService.export('/process37/export', params).then((res) => {
        this.loading = false
        const blob = res
        let dom = document.createElement('a')
        let url = window.URL.createObjectURL(blob)
        dom.href = url
        dom.download = '资金支付信息查询表.xlsx'
        document.body.appendChild(dom)
        dom.click()
        document.body.removeChild(dom)
        window.URL.revokeObjectURL(url)
      })
    }
  }
})
</script>

<style lang="less" scoped>
.pagina {
  width: 100% !important;
  height: 40px !important;
}

.running {
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
