<template>
  <div class="first-container" v-loading.fullscreen.lock="loading">
    <div class="base-msg">
      <el-button class="title-button" @click="isShowSearch = !isShowSearch" type="text">
        <h3 class="sub-title">
          事项基本信息
          <span>
            <i :class="isShowSearch ? 'el-icon-arrow-down' : 'el-icon-arrow-up'"></i>
          </span>
        </h3>
      </el-button>
      <el-form v-show="!isShowSearch" :disabled="disabledShow" :model="matterBaseMsg" ref="formRef" label-width="130px" label-position="right" :rules="matterBaseMsgRules">
        <el-row :gutter="24">
          <el-col :span="12">
            <el-form-item label="事项编码：">
              <el-input v-model="matterBaseMsg.zyssxbm" :disabled="true"></el-input>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="事项名称：" prop="zyssxmc">
              <el-input maxlength="128" v-model="matterBaseMsg.zyssxmc"></el-input>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="24">
          <el-col :span="12">
            <el-form-item label="一级单位：" prop="yjdw">
              <el-select :disabled="isShowOrEdit" filterable v-model="matterBaseMsg.yjdw" @change="selectYjdwHandle">
                <el-option :key="item.code" v-for="item in props.baseMsgData.yjdwListData" :label="item.name" :value="item.code"></el-option>
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="二级单位：" prop="ejdw">
              <el-select :disabled="isShowOrEdit" filterable v-model="matterBaseMsg.ejdw" @change="selectEjdwHandle">
                <el-option :key="item.code" v-for="item in ejdwListData" :label="item.name" :value="item.code"></el-option>
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="24">
          <el-col :span="12">
            <el-form-item label="归口部门：" prop="zgkbmId">
              <el-select v-model="matterBaseMsg.zgkbmId" @change="getGkbmXzHandle">
                <el-option :key="item.code" v-for="item in gkbmListData" :label="item.name" :value="item.code"></el-option>
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="处室：" prop="csId">
              <el-select :disabled="!isDisabled" v-model="matterBaseMsg.csId">
                <el-option :key="item.code" v-for="item in csDataList" :label="item.name" :value="item.code"></el-option>
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="24">
          <el-col :span="12">
            <el-form-item label="资金来源：" prop="zjly">
              <el-select v-model="matterBaseMsg.zjly" :disabled="true" placeholder=" ">
                <el-option :label="zjlyData.name" :value="zjlyData.code"></el-option>
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="项目类型：" prop="xmlxList">
              <el-cascader ref="xmlxRef" @change="getXmlxHandle" filterable style="width: 100%" :show-all-levels="false" :props="{ children: 'children', label: 'name', value: 'middleId' }" :options="projectTypeListData" v-model="matterBaseMsg.xmlxList" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="24">
          <el-col :span="12">
            <el-form-item label="重点投向：" prop="yslxctId">
              <el-select :disabled="disabledShow" style="width: 100%" filterable v-model="matterBaseMsg.yslxctId">
                <el-option :key="item.value" v-for="item in yslxctData" :label="item.ctmc" :value="item.id"></el-option>
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="是否预安排：" prop="isYap">
              <el-select v-model="matterBaseMsg.isYap">
                <el-option :key="item.value" v-for="item in props.baseMsgData.isYapListData" :label="item.label" :value="item.value"></el-option>
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="24">
          <el-col :span="12" v-if="props.baseMsgData.jd !== '2'">
            <el-form-item label="年度：">
              <el-date-picker :clearable="true" value-format="YYYY" type="year" style="width: 100%" v-model="matterBaseMsg.nd"></el-date-picker>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="事项预算(万元)：" prop="sxys">
              <el-input maxlength="20" :oninput="(input: any) => inputSxysHandle(input)" v-model="matterBaseMsg.sxys" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="事项性质：">
              <el-select v-model="matterBaseMsg.sxxz" placeholder="" clearable>
                <el-option :key="item.code" v-for="item in selectDataList.sxxzList" :label="item.name" :value="item.code"></el-option>
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="24">
          <el-col :span="24">
            <el-form-item label="备注：">
              <el-input maxlength="50" v-model="matterBaseMsg.remark" type="textarea" row="3" resize="none" />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
    </div>
    <div class="outbound" v-if="props.baseMsgData.jd === '2'">
      <el-button class="title-button" @click="isShowOutbound = !isShowOutbound" type="text">
        <h3 class="sub-title">
          事项出库信息
          <span>
            <i :class="isShowOutbound ? 'el-icon-arrow-down' : 'el-icon-arrow-up'"></i>
          </span>
        </h3>
      </el-button>
      <div v-show="!isShowOutbound" class="formData">
        <el-form label-width="130px" label-position="right" :disabled="isDisabledShow">
          <el-row :gutter="24">
            <el-col :span="12" v-if="props.baseMsgData.jd === '2'">
              <el-form-item label="出库年份：">
                <el-date-picker :clearable="false" @change="updateXmbListHandle" value-format="YYYY" type="year" style="width: 100%" v-model="matterBaseMsg.nd"></el-date-picker>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="项目包名称：">
                <el-select v-model="matterBaseMsg.xmbbm">
                  <el-option v-for="item in xmbmcData" :key="item.code" :label="item.name" :value="item.code"></el-option>
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>
        </el-form>
      </div>
    </div>
    <div class="unit-msg">
      <el-button class="title-button" @click="isShowTable = !isShowTable" type="text">
        <h3 class="sub-title">
          实施单位及费用安排
          <span>
            <i :class="isShowTable ? 'el-icon-arrow-down' : 'el-icon-arrow-up'"></i>
          </span>
        </h3>
      </el-button>
      <div v-show="!isShowTable" class="unit-table">
        <el-table size="mini" :summary-method="getSummaries" show-summary :data="unitTableData" border stripe>
          <el-table-column width="250" prop="dwName" header-align="center" label="实施单位" align="center"></el-table-column>
          <el-table-column prop="fjYs" align="right" header-align="center" label="费用安排（万元）">
            <template #default="scope">
              <el-input class="ipt" :disabled="props.baseMsgData.operationFlag === 'VIEW'" maxlength="20" @focus="focusHandle" :oninput="(input: any) => inputChange(input)" v-model="scope.row.fjYs" style="width: 100%" />
            </template>
          </el-table-column>
          <el-table-column prop="ztimestamp" header-align="center" align="center" label="新增时间"></el-table-column>
          <el-table-column prop="zhggrq" header-align="center" align="center" label="最近更新时间"></el-table-column>
        </el-table>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
export default {
  name: "MatterBaseMsg"
};
</script>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, toRefs, defineProps, defineExpose, defineEmits } from "vue";
import { BaseMsgData, MsgData } from "../types/matterDecl";
import { getEjdwList } from "@/api/matter";
import { ElMessage } from "element-plus";
import { addorEditMsg, getChildData, getCsByBm, getGkbmByEjdw, getSsdw, getYslxct, getZjly } from "@/api/matter/yssxMatter";
import { Decimal } from "decimal.js";
import { getXmbmc } from "@/api/process";
import { yssxCksave } from "@/api/matter/matterYsck";
import { getPublicData, getProtypeTreeByGkbm } from "@/api/common";

interface Props {
  baseMsgData: BaseMsgData;
}

const props = defineProps<Props>();

onMounted(async () => {
  await initData();
  matterBaseMsg.zyssxbm = props.baseMsgData.operationFlag === "ADD" ? props.baseMsgData.yssxbm : selectedData.yssxbm;
  if (props.baseMsgData.operationFlag === "EDIT" || props.baseMsgData.operationFlag === "VIEW") {
    await getYslxctData(props.baseMsgData.selectedData.middleId, props.baseMsgData.selectedData.zgkbmId);
    await editMsgShow();
  }
});

const xmlxRef = ref();

const initData = async () => {
  const [sxxzList, zdtxList] = await Promise.all([getPublicData("ZLYS_YSSX_SXXZ"), getPublicData("ZLYS_YSSX_ZDTX")]);
  selectDataList.sxxzList = sxxzList.data;
  selectDataList.zdtxList = zdtxList.data;
};

// 获取项目类型
const getProjectData = async (gkbmId: string) => {
  loading.value = true;
  let res = await getProtypeTreeByGkbm(gkbmId);
  if (res.success) {
    projectTypeListData.value = res.data;
    loading.value = false;
  } else {
    loading.value = false;
    ElMessage({
      type: "error",
      message: res.msg
    });
  }
};

const updateXmbListHandle = (val: string) => {
  getXmbmcList(val);
};

const xmbmcData: any = ref([]);

const getXmbmcList = async (nd: string) => {
  loading.value = true;
  matterBaseMsg.xmbbm = "";
  xmbmcData.value.length = 0;
  const params = {
    year: nd,
    xmlx: matterBaseMsg.xmlx,
    middleId: matterBaseMsg.middleId
  };
  let res = await getXmbmc(params);
  if (res.data) {
    xmbmcData.value.push(...res.data);
  }
  if (res.success) {
    loading.value = false;
  } else {
    loading.value = false;
    ElMessage({
      type: "error",
      message: res.msg
    });
  }
};

const disabledShow = computed(() => props.baseMsgData.operationFlag === "VIEW" || props.baseMsgData.jd === "2");
const isDisabledShow = computed(() => props.baseMsgData.operationFlag === "VIEW");
const isShowOrEdit = computed(() => props.baseMsgData.operationFlag === "EDIT" || !!matterBaseMsg.id);

const isShowSearch = ref(false);
const isShowTable = ref(false);
const isShowOutbound = ref(false);

const emit = defineEmits<{
  (e: "closeDialog", flag: boolean): void;
  (e: "updateTable"): void;
}>();

const unitTableData = ref([]);
const formRef = ref();
const loading = ref(false);

const selectedData = reactive(toRefs(props.baseMsgData.selectedData));

const checkCs = (rule: any, value: any, callback: any) => {
  if (matterBaseMsg.zjly === "0" && !value) {
    return callback(new Error("处室不能为空"));
  } else {
    callback();
  }
  if (matterBaseMsg.zjly !== "0") {
    callback();
  }
};

const matterBaseMsgRules: any = reactive({
  zyssxmc: [{ required: true, message: "请输入事项名称", trigger: "blur" }],
  yjdw: [{ required: true, message: "请选择一级单位", trigger: "change" }],
  ejdw: [{ required: true, message: "请选择二级单位", trigger: "change" }],
  zjly: [{ required: true, message: "请选择资金来源", trigger: "change" }],
  xmlxList: [{ required: true, message: "请选择项目类型", trigger: "change" }],
  yslxctId: [{ required: true, message: "请选择重点投向", trigger: "change" }],
  isYap: [{ required: true, message: "请选择是否预安排", trigger: "change" }],
  zgkbmId: [{ required: true, message: "请选择归口部门", trigger: "change" }],
  sxys: [{ required: true, message: "请输入预算事项(万元)", trigger: "blur" }],
  csId: [{ validator: checkCs, trigger: "change" }]
});

const closeDialogHandle = () => {
  emit("closeDialog", false);
};

const isDisabled = computed(() => {
  return matterBaseMsg.zjly === "0";
});

const editMsgShow = async () => {
  loading.value = true;
  let yjdwList = await getEjdwList({
    parentId: selectedData.yjdw,
    specialorgid: props.baseMsgData.specialOrgId
  });
  let [gkbmList, zjly] = await Promise.all([getGkbmByEjdw(selectedData.ejdw), getZjly(selectedData.ejdw)]);
  gkbmListData.value.push(...gkbmList.data);
  zjlyData.value = zjly.data;
  matterBaseMsg.zjly = zjly.data.code;
  ejdwListData.value.push(...yjdwList.data);
  matterBaseMsg.id = selectedData.id;
  matterBaseMsg.yslxctId = selectedData.yslxctId;
  await getGkbmXzHandle(selectedData.zgkbmId, true);
  matterBaseMsg.zyssxmc = selectedData.yssxmc;
  matterBaseMsg.yjdw = selectedData.yjdw;
  matterBaseMsg.ejdw = selectedData.ejdw;
  matterBaseMsg.xmlx = selectedData.xmlx;
  matterBaseMsg.isYap = selectedData.isYap;
  matterBaseMsg.zgkbmId = selectedData.zgkbmId;
  matterBaseMsg.remark = selectedData.remark;
  matterBaseMsg.sxys = selectedData.sxys;
  matterBaseMsg.csId = selectedData.csId;
  matterBaseMsg.nd = selectedData.nd;
  matterBaseMsg.sxxz = selectedData.sxxz;
  matterBaseMsg.zdtx = selectedData.zdtx;
  matterBaseMsg.middleId = selectedData.middleId;
  matterBaseMsg.xmlxList = selectedData.middleId;
  let ssdwTable = await getChildData({
    id: selectedData.id,
    yssxId: selectedData.yssxId,
    jd: props.baseMsgData.jd,
    specialorgid: props.baseMsgData.specialOrgId
  });

  if (props.baseMsgData.jd === "2") {
    if (selectedData.nd) {
      getXmbmcList(selectedData.nd).then(() => {
        matterBaseMsg.xmbbm = selectedData.xmbbm;
      });
    }
  }

  unitTableData.value = ssdwTable.data;

  loading.value = false;
};

const projectTypeListData = ref<any>([]);

const selectDataList = reactive<{
  sxxzList: MsgData[];
  zdtxList: MsgData[];
}>({
  sxxzList: [],
  zdtxList: []
});

const matterBaseMsg = reactive({
  id: "",
  middleId: "",
  zyssxbm: "",
  zyssxmc: "",
  zjly: "",
  yjdw: "",
  ejdw: "",
  xmlxList: "",
  xmlx: "",
  yslxctId: "",
  isYap: "0",
  zgkbmId: "",
  csId: "",
  nd: "",
  sxys: "",
  remark: "",
  zgkbmXz: "",
  xmbbm: "",
  sxxz: "",
  zdtx: ""
});

const ejdwListData: any = ref([]);
const gkbmListData: any = ref([]);
const yslxctData: any = ref([]);
const csDataList: any = ref([]);
const zjlyData = ref<MsgData>({
  code: "",
  name: ""
});

const selectYjdwHandle = async (val: string) => {
  ejdwListData.value.length = 0;
  matterBaseMsg.ejdw = "";
  gkbmListData.value.length = 0;
  matterBaseMsg.zgkbmId = "";
  csDataList.value.length = 0;
  matterBaseMsg.csId = "";
  matterBaseMsg.zjly = "";
  projectTypeListData.value.length = 0;
  matterBaseMsg.xmlxList = "";
  if (Array.isArray(unitTableData.value)) {
    unitTableData.value.length = 0;
  } else {
    unitTableData.value = [];
  }

  loading.value = true;
  if (val) {
    let res = await getEjdwList({
      parentId: val,
      specialorgid: props.baseMsgData.specialOrgId
    });
    if (res.success) {
      ejdwListData.value.push(...res.data);
      loading.value = false;
      if (props.baseMsgData.operationFlag === "ADD") {
        matterBaseMsg.yslxctId = "";
        yslxctData.value.length = 0;
      }
    } else {
      ElMessage({
        type: "error",
        message: res.msg
      });
      loading.value = false;
    }
  } else {
    loading.value = false;
  }
};

const selectEjdwHandle = async (val: string) => {
  loading.value = true;
  gkbmListData.value.length = 0;
  matterBaseMsg.zgkbmId = "";
  matterBaseMsg.zjly = "";
  csDataList.value.length = 0;
  matterBaseMsg.csId = "";
  projectTypeListData.value.length = 0;
  matterBaseMsg.xmlxList = "";
  if (Array.isArray(unitTableData.value)) {
    unitTableData.value.length = 0;
  } else {
    unitTableData.value = [];
  }
  if (val) {
    let ssdwTable = await getSsdw({
      ejdw: val,
      specialorgid: props.baseMsgData.specialOrgId
    });
    unitTableData.value = ssdwTable.data;
    if (props.baseMsgData.operationFlag === "ADD") {
      matterBaseMsg.yslxctId = "";
      yslxctData.value.length = 0;
    }
    let [gkbmList, zjly] = await Promise.all([getGkbmByEjdw(val), getZjly(val)]);
    if (gkbmList.success && zjly.success) {
      gkbmListData.value.push(...gkbmList.data);
      zjlyData.value = zjly.data;
      matterBaseMsg.zjly = zjly.data.code;
    } else {
      ElMessage({
        type: "error",
        message: "请求失败,请重新再试"
      });
    }
    loading.value = false;
  } else {
    loading.value = false;
  }
};

const getYslxctData = async (middleId: string, gkbmId: string) => {
  if (!middleId || !gkbmId) {
    return;
  }
  loading.value = true;
  let res = await getYslxct(gkbmId, middleId);
  if (res.success) {
    yslxctData.value = res.data;
    loading.value = false;
  } else {
    ElMessage({
      type: "error",
      message: res.msg
    });
    loading.value = false;
  }
};
const focusHandle = (event: any) => {
  if (event.target.value === "-") event.target.value = "";
};

const inputChange = (event: any) => {
  event.target.value = "" + event.target.value;
  event.target.value =
    event.target.value
      .replace(/[^\d^.-]+/g, "") // 包括负号的匹配
      .replace(/^0+(\d)/, "$1")
      .replace(/^\./, "0.")
      .match(/^[-]?\d{0,12}(?:\.\d{0,6})?/)[0] || "";
};

const inputSxysHandle = (event: any) => {
  event.target.value = "" + event.target.value;
  event.target.value =
    event.target.value
      .replace(/[^\d^.-]+/g, "") // 包括负号的匹配
      .replace(/^0+(\d)/, "$1")
      .replace(/^\./, "0.")
      .match(/^[-]?\d{0,12}(?:\.\d{0,6})?/)[0] || "";
};

const getGkbmXzHandle = async (val: string, flag?: boolean) => {
  if (!flag) {
    matterBaseMsg.xmlx = "";
    matterBaseMsg.xmlxList = "";
    matterBaseMsg.middleId = "";
    matterBaseMsg.yslxctId = "";
    yslxctData.value.length = 0;
  }
  await getProjectData(val);
  if (matterBaseMsg.zjly === "0") {
    loading.value = true;
    matterBaseMsg.csId = "";
    let res = await getCsByBm(val);
    if (res.success) {
      csDataList.value = res.data;
      loading.value = false;
    } else {
      ElMessage({
        type: "error",
        message: res.msg
      });
      loading.value = false;
    }
  }
  getYslxctData(matterBaseMsg.middleId, val);
  let data: MsgData = gkbmListData.value.filter((item: MsgData) => item.code === val);
  matterBaseMsg.zgkbmXz = data.unicode as string;
};

const totalSum = ref(0);

const getSummaries = (params: any) => {
  const { columns, data } = params;
  const sums: any = [];
  columns.forEach((column: any, index: any) => {
    if (index === 0) {
      sums[index] = "合计";
      return;
    }
    if (data) {
      const values = data.map((item: any) => item[column.property]);
      if (column.property === "fjYs") {
        if (!values.every((value: any) => isNaN(value) && value !== "")) {
          sums[index] = values.reduce((prev: any, curr: any) => {
            let value = curr;
            if (!isNaN(value)) {
              if (!value) value = 0;
              return Decimal.add(prev, value);
            } else {
              return prev;
            }
          }, 0);
          totalSum.value = sums[index];
          sums[index] += " （万元）";
        } else {
          sums[index] = "";
        }
      }
    }
  });
  return sums;
};

const getXmlxHandle = () => {
  let curNode = xmlxRef.value.getCheckedNodes(true)[0];
  matterBaseMsg.xmlx = curNode.data.id;
  matterBaseMsg.middleId = curNode.data.middleId;
  matterBaseMsg.yslxctId = "";
  yslxctData.value.length = 0;
  getYslxctData(matterBaseMsg.middleId, matterBaseMsg.zgkbmId);
};

const submitFlag = ref("-1");

const submitHandle = (remarkSubmit: (params?: any) => void) => {
  formRef.value.validate(async (valid: any) => {
    if (valid) {
      if (!matterBaseMsg.nd && props.baseMsgData.jd === "2") {
        ElMessage.error("请选择出库年份!");
        return;
      }
      if (!matterBaseMsg.xmbbm && props.baseMsgData.jd === "2") {
        ElMessage.error("请选择项目包!");
        return;
      }
      loading.value = true;
      if (props.baseMsgData.jd === "2") {
        let xmbData = xmbmcData.value.filter((item: any) => item.code === matterBaseMsg.xmbbm);
        let res = await yssxCksave({
          xmbbm: matterBaseMsg.xmbbm,
          nd: matterBaseMsg.nd,
          dnys: matterBaseMsg.sxys,
          id: matterBaseMsg.id,
          childData: unitTableData.value,
          middleid: matterBaseMsg.middleId
        });
        if (res.success) {
          emit("updateTable");
          submitFlag.value = "1";
          ElMessage({
            type: "success",
            message: "保存成功"
          });
          loading.value = false;
          remarkSubmit();
        } else {
          ElMessage({
            type: "error",
            message: res.msg
          });
          loading.value = false;
        }
      } else {
        emit("updateTable");
        let res = await addorEditMsg({
          ...matterBaseMsg,
          childData: unitTableData.value
        });
        if (res.success) {
          emit("updateTable");
          ElMessage({
            type: "success",
            message: "保存成功"
          });
          if (props.baseMsgData.operationFlag === "ADD") {
            matterBaseMsg.id = res.data;
            let ssdwTable = await getChildData({
              id: res.data,
              yssxId: res.data,
              jd: props.baseMsgData.jd,
              specialorgid: props.baseMsgData.specialOrgId
            });
            unitTableData.value = ssdwTable.data;
            remarkSubmit(res.data);
          } else {
            remarkSubmit();
          }
          loading.value = false;
          // closeDialogHandle();
        } else {
          ElMessage({
            type: "error",
            message: res.msg
          });
          loading.value = false;
        }
      }
    } else {
      return false;
    }
  });
};

defineExpose({ matterBaseMsg, submitHandle, closeDialogHandle });
</script>

<style scoped lang="less">
.el-select,
.el-data-pick {
  width: 100%;
}

.first-container {
  position: relative;
  height: 820px;
  padding: 10px 34px;
  overflow-x: hidden;

  .outbound {
    .formData {
      height: 40px;
    }
  }

  .unit-msg {
    width: 100%;

    .unit-table {
      width: 100%;
    }
  }
}

.input-postion {
  width: 100%;

  :deep(.el-input__inner) {
    text-align: left;
  }
}

.operation {
  margin-top: 10px;
  text-align: center;
}

:deep(.el-table) {
  display: flex;
  flex-direction: column;
}

:deep(.el-table__body-wrapper) {
  order: 1;
}

.sub-title {
  font-size: 18px;
}

.ipt {
  :deep(.el-input__inner) {
    text-align: right;
  }
}

.title-button {
  margin: 0 0 10px 0;
  padding: 0;
  height: 40px;
}
</style>
