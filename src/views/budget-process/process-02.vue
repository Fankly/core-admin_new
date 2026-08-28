<template>
  <div class="browseDetail" v-loading="loading" element-loading-text="正在从服务器获取数据.....">
    <div class="topBox">
      <div class="title">
        <div class="titleBox">
          <h2>预算全过程总览明细</h2>
        </div>
        <div class="searchBox">
          <el-dropdown style="margin-right: 30px; cursor: pointer" trigger="click" :hide-on-click="false">
            <span class="el-dropdown-link">
              <el-icon class="el-icon-s-operation" style="font-size: 18px">
                <arrow-down />
              </el-icon>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item v-for="item in applications" :key="item.value">
                  <el-checkbox style="margin-right: 10px" v-model="item.checked" @change="listShow(item.value, item.checked)"></el-checkbox>
                  {{ item.label }}
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
          <span style="margin-right: 20px">
            <span class="searchShow" v-if="searchShow == false" @click="showSearch(true)">
              <i class="el-icon-arrow-down" style="font-size: 18px"></i>
            </span>
            <span class="searchShow" @click="showSearch(false)" v-else>
              <i class="el-icon-arrow-up" style="font-size: 18px"></i>
            </span>
          </span>
          <span class="searchShow">
            <i class="el-icon-question" style="font-size: 18px" @click="helpHandle"></i>
          </span>
        </div>
      </div>

      <div class="search" v-show="searchShow">
        <el-form label-position="left" label-width="100px">
          <el-row :gutter="24">
            <el-col :span="6">
              <el-form-item label="项目编码：">
                <copyTextBox class="formWidth" ref="xmbm"></copyTextBox>
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="项目类型：">
                <projectType class="formWidth" ref="type"></projectType>
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="所属单位：">
                <affiliatedUnit class="formWidth" ref="company"></affiliatedUnit>
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="项目名称：">
                <el-input class="formWidth" v-model="dataList.post1" />
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="24">
            <el-col :span="6">
              <el-form-item label="项目状态：">
                <Projectstatus class="formWidth" ref="xmzt"></Projectstatus>
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="归口部门：">
                <Centralized class="formWidth" ref="gkbm"></Centralized>
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="项目包名称：">
                <el-input class="formWidth" v-model="dataList.xmb" />
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="项目性质：">
                <projectnature class="formWidth" ref="xmxz"></projectnature>
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="24">
            <el-col :span="6">
              <el-form-item label="截至日期：">
                <el-date-picker v-model="dataList.month" type="month" placeholder="选择月"></el-date-picker>
              </el-form-item>
            </el-col>
            <el-col :span="6"></el-col>
            <el-col :span="6"></el-col>
            <el-col :span="6" class="btnPostion">
              <el-button type="primary" icon="el-icon-search" @click="searchBtn">查 询 </el-button>
              <el-button icon="el-icon-refresh-right" @click="reset">重 置</el-button>
              <el-button type="warning" icon="el-icon-download" @click="exportBtn">导 出</el-button>
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
      :header-cell-style="{ 'text-align': 'center' }"
      :cell-style="{ 'text-align': 'center' }"
    >
      <el-table-column label="项目编码" fixed width="150">
        <template #default="scope">
          <el-dropdown>
            <span class="el-dropdown-link">
              <a style="cursor: pointer">{{ scope.row.pspid }}</a>
              <i class="el-icon-arrow-down"></i>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item @click="goTable(item.value, scope.row.pspid, item.flag)" v-for="(item, index) in tables" :key="index"
                  >{{ item.label }}
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </template>
      </el-table-column>
      <el-table-column prop="post1" fixed label="项目名称" :width="dropCol[0].width"></el-table-column>
      <el-table-column prop="zxmzt" label="项目状态" :width="dropCol[1].width"></el-table-column>
      <el-table-column prop="qkjxmlxmc" label="项目类型" v-if="columnObj.QKJXMLXMC" :width="dropCol[2].width"></el-table-column>
      <el-table-column prop="qkjxmb_mc" label="项目包" v-if="columnObj.QKJXMB_MC" :width="dropCol[3].width"></el-table-column>
      <el-table-column prop="zjsjd_mc" label="项目性质" :width="dropCol[4].width"></el-table-column>
      <el-table-column prop="qkjyjdw_name" label="一级单位" v-if="columnObj.QKJYJDW_NAME" :width="dropCol[5].width"></el-table-column>
      <el-table-column prop="qkjejdw_name" label="二级单位" v-if="columnObj.QKJEJDW_NAME" :width="dropCol[6].width"></el-table-column>
      <el-table-column prop="qkjgkbm_name" label="归口部门" v-if="columnObj.QKJGKBM_NAME" :width="dropCol[7].width"></el-table-column>
      <el-table-column prop="erpztys" label="总投资" v-if="columnObj.ERPZTYS" :width="dropCol[8].width"></el-table-column>
      <el-table-column prop="njtzjh" label="当年投资计划" v-if="columnObj.NJTZJH" :width="dropCol[9].width"></el-table-column>
      <el-table-column prop="erpjdys" label="年度预算" v-if="columnObj.ERPJDYS" :width="dropCol[10].width"></el-table-column>
      <el-table-column label="项目储备与立项" v-if="columnObj.cbylx">
        <el-table-column prop="saptime" label="立项日期" :width="dropCol[11].width"></el-table-column>
        <el-table-column prop="zjhkg" label="计划开工日期" :width="dropCol[12].width"></el-table-column>
        <el-table-column prop="zjhjg" label="计划竣工日期" :width="dropCol[13].width"></el-table-column>
      </el-table-column>
      <el-table-column label="招投标(项目化)" v-if="columnObj.ztb">
        <el-table-column label="首笔需求提报日期" :width="dropCol[14].width" prop="sbxjsbrq"></el-table-column>
        <el-table-column label="首笔需求中标日期" :width="dropCol[15].width" prop="sbxqzbrq"></el-table-column>
        <el-table-column label="当年物资招标金额" :width="dropCol[16].width" prop="ndzbxqtb_wz"></el-table-column>
        <el-table-column label="当年物资中标金额" :width="dropCol[17].width" prop="ndzhongbje_wz"></el-table-column>
        <el-table-column label="当年服务招标金额" :width="dropCol[18].width" prop="ndzbxqtb_fw"></el-table-column>
        <el-table-column label="当年服务中标金额" :width="dropCol[19].width" prop="ndzhongbje_fw"></el-table-column>
        <el-table-column label="物资需求招标中金额" :width="dropCol[20].width" prop="wzxqzbje"></el-table-column>
        <el-table-column label="服务需求招标中金额" :width="dropCol[21].width" prop="fwxqzbje"></el-table-column>
      </el-table-column>
      <el-table-column label="合同签订" v-if="columnObj.htqd">
        <el-table-column label="首份服务合同签订时间" :width="dropCol[22].width" prop="sbhtqdrq_fw"></el-table-column>
        <el-table-column label="合同已签订金额" :width="dropCol[23].width" prop="ljbjhtje"></el-table-column>
        <el-table-column label="合同签订中金额" :width="dropCol[24].width" prop="ljbjhtjeqdz"></el-table-column>
      </el-table-column>

      <el-table-column label="项目实施" v-if="columnObj.xmss">
        <el-table-column label="实际开工日期" :width="dropCol[25].width" prop="zsjks"></el-table-column>
        <el-table-column label="首批物资到货时间" :width="dropCol[26].width" prop="sbwzsjdhrq"></el-table-column>
        <!-- <el-table-column label="首次物资领用日期" width="160" prop="wbwzlyrq"></el-table-column> -->
        <el-table-column label="首次项目物资领用日期" :width="dropCol[27].width" prop="wbxmwzlyrq"></el-table-column>
        <el-table-column label="首次通用物资领用日期" :width="dropCol[28].width" prop="wbtywzlyrq"></el-table-column>
        <el-table-column label="项目化物资当年领用金额" :width="dropCol[29].width" prop="xmwzlyje_ndhs"></el-table-column>
        <el-table-column label="通用物资当年领用金额" :width="dropCol[30].width" prop="tywzlyje_ndhs"></el-table-column>
        <el-table-column label="在途物资金额" :width="dropCol[31].width" prop="ndzbghzje"></el-table-column>
        <el-table-column label="库存物资金额" :width="dropCol[32].width" prop="ndlyje_hs"></el-table-column>
        <el-table-column label="预算累计调整金额" :width="dropCol[33].width" prop="erpndysbd"></el-table-column>
        <el-table-column label="实际竣工日期" :width="dropCol[34].width" prop="zsjjg"></el-table-column>
      </el-table-column>

      <el-table-column label="项目审计" v-if="columnObj.xmsj">
        <el-table-column label="首次送审时间" :width="dropCol[35].width" prop="scssrq"></el-table-column>
        <el-table-column label="首次审定时间" :width="dropCol[36].width" prop="scsdrq"></el-table-column>
        <el-table-column label="累计送审金额" :width="dropCol[37].width" prop="ljssje"></el-table-column>
        <el-table-column label="累计审定金额" :width="dropCol[38].width" prop="ljsdje"></el-table-column>
        <el-table-column label="审计中金额" :width="dropCol[39].width" prop="sjzje"></el-table-column>
      </el-table-column>

      <el-table-column label="结算与资金支付" v-if="columnObj.jsyzjzf">
        <el-table-column label="首次财务支出时间" :width="dropCol[40].width" prop="sbcwzcrq"></el-table-column>
        <el-table-column label="当年财务支出(含税)" :width="dropCol[41].width" prop="ndzc_hs"></el-table-column>
        <el-table-column label="当年财务支出(不含税)" :width="dropCol[42].width" prop="ndzcb_hs"></el-table-column>
        <el-table-column label="承诺项占用值" :width="dropCol[43].width" prop="cnxje"></el-table-column>
        <el-table-column label="当年资金支付金额" :width="dropCol[44].width" prop="zjzfje"></el-table-column>
        <el-table-column label="累计资金支付金额" :width="dropCol[45].width" prop="ljzjzfje"></el-table-column>
        <el-table-column label="未清理往来金额" :width="dropCol[46].width" prop="wqlwl"></el-table-column>
      </el-table-column>

      <el-table-column label="决算与增资" v-if="columnObj.jsyzz">
        <el-table-column label="决算送审日期" :width="dropCol[47].width" prop="jus_sendrq" v-if="columnObj.jsssrq"></el-table-column>
        <el-table-column label="决算审定日期" :width="dropCol[48].width" prop="jus_sdrq" v-if="columnObj.jssdrq"></el-table-column>
        <el-table-column label="决算送审金额" :width="dropCol[49].width" prop="jus_sendamt" v-if="columnObj.jsssje"></el-table-column>
        <el-table-column label="决算审定金额" :width="dropCol[50].width" prop="jus_settleamt" v-if="columnObj.jssdje"></el-table-column>
        <el-table-column label="首次增资日期" :width="dropCol[51].width" prop="zgzzrq"></el-table-column>
        <el-table-column label="最近增资日期" :width="dropCol[52].width" prop="zjzzrq"></el-table-column>
        <el-table-column label="累计增资次数" :width="dropCol[53].width" prop="zljzzcs"></el-table-column>
        <el-table-column label="当年增资金额" :width="dropCol[54].width" prop="zdnzzje"></el-table-column>
        <el-table-column label="累计增资金额" :width="dropCol[55].width" prop="zszzje"></el-table-column>
        <el-table-column label="在建工程" :width="dropCol[56].width" prop="zjgcye"></el-table-column>
      </el-table-column>

      <el-table-column label="项目关闭" prop="stat" v-if="columnObj.xmgb" :width="dropCol[36].width"></el-table-column>
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
import { defineComponent, reactive, ref } from 'vue'
import baseService from '@/service/baseService'
import { ElMessage } from 'element-plus'
import projectType from '@/components/select/projectType.vue'
import affiliatedUnit from '@/components/select/affiliatedUnit.vue'
import copyTextBox from '@/components/select/copyTextBox.vue'
import Centralized from '@/components/select/Centralized.vue'
import projectnature from '@/components/select/projectnature.vue'
import Projectstatus from '@/components/select/Projectstatus.vue'
import userDialog from '@/components/select/userDialog.vue'
import { useStore } from 'vuex'
import { showHelpMsg } from '@/utils/message'
import { getMaxLength } from '@/utils/utils'
export default defineComponent({
  name: '/budget-process/process-02',
  components: {
    projectType,
    affiliatedUnit,
    copyTextBox,
    Centralized,
    projectnature,
    Projectstatus,
    userDialog
  },
  setup() {
    const store = useStore()
    const helpHandle = () => {
      const url = store.getters.getMenuMsg.url
      showHelpMsg(url)
    }
    return reactive({
      helpHandle,
      //搜索条件数据
      store,
      dataList: {
        month: new Date(),
        post1: '',
        xmb: ''
      },
      //搜索区域显示与隐藏
      searchShow: true,
      tableHeight: '',
      topHeight: '',
      heightNum: '',
      searchHeight: '',
      loading: false,

      //表格数据
      example: [],

      //控制表格列显示与隐藏
      columnObj: {},
      //列设置默认展示字段
      //默认所有
      applicationId: [],
      dropCol: [
        {
          label: '项目名称',
          prop: 'post1'
        },
        {
          label: '项目状态',
          prop: 'zxmzt'
        },
        {
          label: '项目类型',
          prop: 'qkjxmlxmc'
        },
        {
          label: '项目包',
          prop: 'qkjxmb_mc'
        },
        {
          label: '项目性质',
          prop: 'zjsjd_mc'
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
          label: '归口部门',
          prop: 'qkjgkbm_name'
        },
        {
          label: '总投资',
          prop: 'erpztys'
        },
        {
          label: '当年投资计划',
          prop: 'njtzjh'
        },
        {
          label: '年度预算',
          prop: 'erpjdys'
        },
        {
          label: '立项日期',
          prop: 'saptime'
        },
        {
          label: '计划开工日期',
          prop: 'zjhkg'
        },
        {
          label: '计划竣工日期',
          prop: 'zjhjg'
        },
        {
          label: '首笔需求提报日期',
          prop: 'sbxjsbrq'
        },
        {
          label: '首笔需求中标日期',
          prop: 'sbxqzbrq'
        },
        {
          label: '当年物资招标金额',
          prop: 'ndzbxqtb_wz'
        },
        {
          label: '当年物资中标金额',
          prop: 'ndzhongbje_wz'
        },
        {
          label: '当年服务招标金额',
          prop: 'ndzbxqtb_fw'
        },
        {
          label: '当年服务中标金额',
          prop: 'ndzhongbje_fw'
        },
        {
          label: '物资需求招标中金额',
          prop: 'wzxqzbje'
        },
        {
          label: '服务需求招标中金额',
          prop: 'fwxqzbje'
        },
        {
          label: '首份服务合同签订时间',
          prop: 'sbhtqdrq_fw'
        },
        {
          label: '合同已签订金额',
          prop: 'ljbjhtje'
        },
        {
          label: '合同签订中金额',
          prop: 'ljbjhtjeqdz'
        },
        {
          label: '实际开工日期',
          prop: 'zsjks'
        },
        {
          label: '首批物资到货时间',
          prop: 'sbwzsjdhrq'
        },
        {
          label: '首次项目物资领用日期',
          prop: 'wbxmwzlyrq'
        },
        {
          label: '首次通用物资领用日期',
          prop: 'wbtywzlyrq'
        },
        {
          label: '项目化物资当年领用金额',
          prop: 'xmwzlyje_ndhs'
        },
        {
          label: '通用物资当年领用金额',
          prop: 'tywzlyje_ndhs'
        },
        {
          label: '在途物资金额',
          prop: 'ndzbghzje'
        },
        {
          label: '库存物资金额',
          prop: 'ndlyje_hs'
        },
        {
          label: '预算累计调整金额',
          prop: 'erpndysbd'
        },
        {
          label: '实际竣工日期',
          prop: 'zsjjg'
        },
        {
          label: '首次送审时间',
          prop: 'scssrq'
        },
        {
          label: '首次审定时间',
          prop: 'scsdrq'
        },
        {
          label: '累计送审金额',
          prop: 'ljssje'
        },
        {
          label: '累计审定金额',
          prop: 'ljsdje'
        },
        {
          label: '审计中金额',
          prop: 'sjzje'
        },
        {
          label: '首次财务支出时间',
          prop: 'sbcwzcrq'
        },
        {
          label: '当年财务支出(含税)',
          prop: 'ndzc_hs'
        },
        {
          label: '当年财务支出(不含税)',
          prop: 'ndzcb_hs'
        },
        {
          label: '承诺项占用值',
          prop: 'cnxje'
        },
        {
          label: '当年资金支付金额',
          prop: 'zjzfje'
        },
        {
          label: '累计资金支付金额',
          prop: 'ljzjzfje'
        },
        {
          label: '未清理往来金额',
          prop: 'wqlwl'
        },
        {
          label: '决算送审日期',
          prop: 'jus_sendrq'
        },
        {
          label: '决算审定日期',
          prop: 'jus_sdrq'
        },
        {
          label: '决算送审金额',
          prop: 'jus_sendamt'
        },
        {
          label: '决算审定金额',
          prop: 'jus_settleamt'
        },
        {
          label: '首次增资日期',
          prop: 'zgzzrq'
        },
        {
          label: '最近增资日期',
          prop: 'zjzzrq'
        },
        {
          label: '累计增资次数',
          prop: 'zljzzcs'
        },
        {
          label: '当年增资金额',
          prop: 'zdnzzje'
        },
        {
          label: '累计增资金额',
          prop: 'zszzje'
        },
        {
          label: '在建工程',
          prop: 'zjgcye'
        },
        {
          label: '项目关闭',
          prop: 'stat'
        }
      ],
      //列菜单数据
      applications: [
        {
          value: 'QKJXMLXMC',
          label: '项目类型',
          checked: true
        },
        {
          value: 'QKJXMB_MC',
          label: '项目包',
          checked: true
        },
        {
          value: 'QKJYJDW_NAME',
          label: '一级单位',
          checked: true
        },
        {
          value: 'QKJEJDW_NAME',
          label: '二级单位',
          checked: true
        },
        {
          value: 'QKJGKBM_NAME',
          label: '部门',
          checked: true
        },
        {
          value: 'ERPZTYS',
          label: '总投资',
          checked: false
        },
        {
          value: 'NJTZJH',
          label: '当年投资计划',
          checked: false
        },

        {
          value: 'ERPJDYS',
          label: '年度预算',
          checked: true
        },
        {
          value: 'cbylx',
          label: '项目储备与立项',
          checked: true
        },
        {
          value: 'ztb',
          label: '招投标（项目化）',
          checked: true
        },
        {
          value: 'htqd',
          label: '合同签订',
          checked: true
        },
        {
          value: 'xmss',
          label: '项目实施',
          checked: true
        },
        {
          value: 'xmsj',
          label: '项目审计',
          checked: true
        },
        {
          value: 'jsyzjzf',
          label: '结算与资金支付',
          checked: true
        },
        {
          value: 'jsyzz',
          label: '决算与增资',
          checked: true
        },
        {
          value: 'xmgb',
          label: '项目关闭',
          checked: true
        },
        {
          value: 'jsssrq',
          label: '决算送审日期',
          checked: false
        },
        {
          value: 'jssdrq',
          label: '决算审定日期',
          checked: false
        },
        {
          value: 'jsssje',
          label: '决算送审金额',
          checked: false
        },
        {
          value: 'jssdje',
          label: '决算审定金额',
          checked: false
        }
      ],
      page: {
        total: 0,
        limit: 10,
        page: 1,
        current: '1'
      },
      //穿透数据
      tables: [
        {
          label: '招投标环节',
          value: '/budget-process/process-18',
          flag: 'ztb'
        },
        {
          label: '合同签订环节',
          value: '/budget-process/process-19',
          flag: 'htqd'
        },
        {
          label: '项目实施环节',
          value: '/budget-process/process-20',
          flag: 'xmss'
        },
        {
          label: '项目审计环节',
          value: '/budget-process/process-21',
          flag: 'xmsj'
        },
        {
          label: '结算与资金支付环节',
          value: '/budget-process/process-22',
          flag: 'jsyzjzf'
        },
        {
          label: '决算与增资环节',
          value: '/budget-process/process-23',
          flag: 'jsyzz'
        }
      ],
      userCode: '',
      userId: '',
      specialorgid: ''
    })
  },
  created() {
    this.handleColumn()
  },
  mounted() {
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
        if (value.prop === 'qkjxmb_mc' || value.prop === 'post1') {
          value.width = 320
        } else {
          value.width = Math.round(width + 20)
        }
        return value
      })
    },
    setTableHeight() {
      if (this.searchShow == true) {
        this.tableHeight = this.heightNum - this.topHeight - 100 + 'px'
      } else {
        this.tableHeight = this.heightNum - this.topHeight + this.searchHeight - 100 + 'px'
      }
    },
    //获取数据
    loadData() {
      this.loading = true
      if (this.dataList.month) {
        const params = {
          qkjxmlxbms: [],
          qkjejdws: [],
          zyear: '',
          zmonth: '',
          page: this.page.page,
          limit: this.page.limit,
          pspids: [],
          post1: this.dataList.post1,
          zjsjd_mc: this.$refs.xmxz.value,
          gkbms: [],
          xmb: this.dataList.xmb,
          zxmzt: this.$refs.xmzt.value,
          specialorgid: this.specialorgid
        }

        params.qkjxmlxbms = this.$refs.type.selectList
        params.qkjejdws = this.$refs.company.selectList
        params.gkbms = this.$refs.gkbm.selectList

        //项目编码
        if (this.$refs.xmbm) {
          params.pspids = this.$refs.xmbm.array
        }

        if (this.dataList.month != '') {
          let time = new Date(this.dataList.month)
          let zyear = time.getFullYear()
          let zmonth = time.getMonth() + 1
          params.zyear = JSON.stringify(zyear)
          params.zmonth = JSON.stringify(zmonth)
        }

        baseService.post('/process/process02/', params).then((res) => {
          if (res.success == true) {
            this.loading = false
            this.example = res.data.records
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
      } else {
        this.loading = false
        ElMessage({
          message: '请选择日期查询',
          iconClass: 'el-icon-search',
          customClass: 'tipsBox'
        })
      }
    },

    //导出按钮
    async exportBtn() {
      this.loading = true
      if (this.dataList.month) {
        const params = {
          qkjxmlxbms: [],
          qkjejdws: [],
          zyear: '',
          zmonth: '',
          page: this.page.page,
          limit: this.page.limit,
          pspids: [],
          post1: this.dataList.post1,
          zjsjd_mc: this.$refs.xmxz.value,
          gkbms: [],
          xmb: this.dataList.xmb,
          zxmzt: this.$refs.xmzt.value,
          specialorgid: this.specialorgid
        }

        params.qkjxmlxbms = this.$refs.type.selectList
        params.qkjejdws = this.$refs.company.selectList
        params.gkbms = this.$refs.gkbm.selectList

        //项目编码
        if (this.$refs.xmbm) {
          params.pspids = this.$refs.xmbm.array
        }

        if (this.dataList.month != '') {
          let time = new Date(this.dataList.month)
          let zyear = time.getFullYear()
          let zmonth = time.getMonth() + 1
          params.zyear = JSON.stringify(zyear)
          params.zmonth = JSON.stringify(zmonth)
        }

        await baseService.export('/process/process02/export', params).then((res) => {
          this.loading = false
          const blob = res
          let dom = document.createElement('a')
          let url = window.URL.createObjectURL(blob)
          dom.href = url
          dom.download = '全过程总览明细.xlsx'
          document.body.appendChild(dom)
          dom.click()
          document.body.removeChild(dom)
          window.URL.revokeObjectURL(url)
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

    //穿透跳转
    goTable(path, pspid, flag) {
      switch (flag) {
        case 'ztb':
          this.store.commit('ztbData', { pspid: pspid, specialorgid: this.specialorgid })
          break
        case 'htqd':
          this.store.commit('htqdData', { pspid: pspid, specialorgid: this.specialorgid })
          break
        case 'xmss':
          this.store.commit('xmssData', { pspid: pspid, specialorgid: this.specialorgid })
          break
        case 'xmsj':
          this.store.commit('xmsjData', { pspid: pspid, specialorgid: this.specialorgid })
          break
        case 'jsyzjzf':
          this.store.commit('jsyzjzfData', { pspid: pspid, specialorgid: this.specialorgid })
          break
        case 'jsyzz':
          this.store.commit('jsyzzData', { pspid: pspid, specialorgid: this.specialorgid })
          break
      }
      this.$router.push({ path: path })
    },
    //查询
    searchBtn() {
      this.loadData()
    },
    //重置
    reset() {
      this.dataList.month = new Date()
      this.$refs.type.clear()
      this.$refs.company.clear()
      this.$refs.xmbm.clear()
      this.dataList.post1 = ''
      this.dataList.xmb = ''
      this.$refs.gkbm.clear()
      this.$refs.xmxz.clear()
      this.$refs.xmzt.clear()
      this.example = []
      this.loadData()
    },

    //搜索展示与隐藏
    showSearch(i) {
      this.searchShow = i
      this.setTableHeight()
    },

    //处理列数据
    handleColumn() {
      this.applications.forEach((item) => {
        this.applicationId.push(item.value)
        this.columnObj[item.value] = item.checked
      })
    },

    listShow(value, checked) {
      for (let i in this.columnObj) {
        if (i == value) {
          this.columnObj[i] = checked
        }
      }
    },
    loadCompany() {
      this.loading = false
      this.specialorgid = parseInt(this.$refs.userDialog.specialorgid)
      this.$refs.company.getAffiliatedUnit(this.specialorgid)
      this.$refs.gkbm.getProjectType(this.specialorgid)
    }
  }
})
</script>
<style lang="less" scoped>
:deep(.el-date-editor) {
  width: 100%;
}

.browseDetail {
  padding: 10px;

  .topBox {
    margin-bottom: 20px;
  }

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

  .disBox {
    width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}
</style>
