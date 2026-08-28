<template>
  <div class="first-container" v-loading.fullscreen.lock="loading">
    <div class="outbound">
      <el-button class="title-button" @click="isShowOutbound = !isShowOutbound" type="text">
        <h3 class="sub-title">
          事项预算变更申请单信息
          <span>
            <i :class="isShowOutbound ? 'el-icon-arrow-down' : 'el-icon-arrow-up'"></i>
          </span>
        </h3>
      </el-button>
      <div v-show="!isShowOutbound" class="formData">
        <el-form :model="matterChangeMsg" label-width="164px" label-position="right">
          <el-row :gutter="24">
            <el-col :span="12">
              <el-form-item label="变更申请单号：">
                <el-input :disabled="true" v-model="matterChangeMsg.bgsqdh"></el-input>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="变更内容：">
                <el-select :disabled="isDisabled" v-model="matterChangeMsg.bgnr" placeholder="">
                  <el-option :label="item.name" :value="item.code" v-for="item in bgnrList" :key="item.code"></el-option>
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="24">
            <el-col :span="12">
              <el-form-item label="创建时间：">
                <el-input :disabled="true" v-model="matterChangeMsg.bgsj"></el-input>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="创建人：">
                <el-input :disabled="true" v-model="matterChangeMsg.bgr"></el-input>
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="24">
            <el-col :span="12">
              <el-form-item label="变更后事项预算(万元)：">
                <el-input :disabled="true" v-model="matterChangeMsg.bgje" />
              </el-form-item>
            </el-col>
            <el-col :span="12"></el-col>
          </el-row>
          <el-row :gutter="24">
            <el-col :span="24">
              <el-form-item label="原因说明：">
                <el-input :disabled="isDisabled" maxlength="50" v-model="matterChangeMsg.bgyy" type="textarea" row="3" resize="none" />
              </el-form-item>
            </el-col>
          </el-row>
        </el-form>
      </div>
    </div>
    <div class="base-msg">
      <el-button class="title-button" @click="isShowSearch = !isShowSearch" type="text">
        <h3 class="sub-title">
          事项基本信息
          <span>
            <i :class="isShowSearch ? 'el-icon-arrow-down' : 'el-icon-arrow-up'"></i>
          </span>
        </h3>
      </el-button>
      <el-form v-show="!isShowSearch" :disabled="true" :model="matterBaseMsg" ref="formRef" label-width="164px" label-position="right">
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
              <el-select filterable v-model="matterBaseMsg.yjdw" @change="selectYjdwHandle">
                <el-option :key="item.code" v-for="item in props.baseMsgData.yjdwListData" :label="item.name" :value="item.code"></el-option>
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="二级单位：" prop="ejdw">
              <el-select filterable v-model="matterBaseMsg.ejdw" @change="selectEjdwHandle">
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
              <el-select v-model="matterBaseMsg.csId">
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
              <el-select style="width: 100%" filterable v-model="matterBaseMsg.yslxctId">
                <el-option :key="item.value" v-for="item in yslxctData" :label="item.label" :value="item.value"></el-option>
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
          <el-col :span="12">
            <el-form-item label="年度：">
              <el-date-picker :clearable="true" value-format="YYYY" type="year" style="width: 100%" v-model="matterBaseMsg.nd"></el-date-picker>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="事项预算（万元）：">
              <el-input v-model="matterBaseMsg.sxys" />
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
        <el-table v-if="tableHide" size="mini" :summary-method="getSummaries" show-summary :data="unitTableData" border stripe>
          <el-table-column show-overflow-tooltip width="250" prop="dwName" header-align="center" label="实施单位" align="center"></el-table-column>
          <el-table-column prop="dqys" header-align="center" align="right">
            <template #header>
              <div>当前费用安排</div>
              <div>（万元）</div>
            </template>
          </el-table-column>
          <el-table-column prop="tzhys" align="right" header-align="center">
            <template #header>
              <div>调整后费用安排</div>
              <div>（万元）</div>
            </template>
            <template #default="scope">
              <el-input :disabled="isDisabled" class="ipt" @blur="blurHandle(scope)" maxlength="20" @focus="focusHandle" :oninput="(input: any) => inputChange(input, scope)" v-model="scope.row.tzhys" style="width: 100%" />
            </template>
          </el-table-column>
          <el-table-column prop="tzys" header-align="center" align="right">
            <template #header>
              <div>调整情况</div>
              <div>（万元）</div>
            </template>
          </el-table-column>
          <el-table-column v-if="baseMsgDatas.selectedData.zt !== '02'" prop="yfjje" header-align="center" align="right">
            <template #header>
              <div>已分解金额</div>
              <div>（万元）</div>
            </template>
          </el-table-column>
          <el-table-column v-if="baseMsgDatas.selectedData.zt !== '02'" prop="ylxje" header-align="center" align="right">
            <template #header>
              <div>已立项金额</div>
              <div>（万元）</div>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
export default {
  name: "MatterChanges"
};
</script>

<script setup lang="ts">
import { computed, defineProps, defineEmits, defineExpose, onMounted, reactive, ref, toRefs, toRef } from "vue";
import { BaseMsgData, List, MsgData } from "@/views/matter/types/matterDecl";
import { getEjdwList } from "@/api/matter";
import { ElMessage } from "element-plus";
import { getCsByBm, getGkbmByEjdw, getSsdw, getYslxct, getZjly } from "@/api/matter/yssxMatter";
import { Decimal } from "decimal.js";
import { getProtypeTreeByGkbm, getPublicData } from "@/api/common";
import { getFyxxByYssxId, saveData, getSqdh, getFyxxById, getSqdxxById } from "@/api/matter/matterAdjust";
import emits from "@/utils/emits";

interface BGNR {
  name: string;
  code: string;
}

interface Props {
  baseMsgData: BaseMsgData;
}

const props = defineProps<Props>();
const tableHide = computed(() => !!unitTableData.value);

const baseMsgDatas = toRef(props, "baseMsgData");

const isDisabled = computed(() => props.baseMsgData.operationFlag === "VIEW");

onMounted(() => {
  if (props.baseMsgData.operationFlag === "ADD") {
    getBgsqdhData();
  }
  getYslxctData(props.baseMsgData.selectedData.middleId, props.baseMsgData.selectedData.zgkbmId);
  getBgyyData();
  matterBaseMsg.zyssxbm = selectedData.yssxbm;
  editMsgShow();
});

const isShowSearch = ref(false);
const isShowTable = ref(false);
const isShowOutbound = ref(false);

const emit = defineEmits<{
  (e: "closeDialog", flag: boolean): void;
}>();

const unitTableData = ref([]);
const formRef = ref();
const loading = ref(false);

const selectedData = reactive(toRefs(props.baseMsgData.selectedData));

const closeDialogHandle = () => {
  emit("closeDialog", false);
};

const getAllProTypeList: any = (list: any[]) => {
  return list.map((item: any) => {
    // 如果没有children属性
    if (!item.children || item.children.length === 0) {
      return {
        value: item.middleId,
        name: item.name,
        id: item.id
      };
    }
    return {
      value: item.middleId,
      name: item.name,
      id: item.id,
      children: item.children ? getAllProTypeList(item.children) : []
    };
  });
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

const editMsgShow = async () => {
  let yjdwList = await getEjdwList({
    parentId: selectedData.yjdw,
    specialorgid: props.baseMsgData.specialOrgId
  });
  let [gkbmList, zjly] = await Promise.all([getGkbmByEjdw(selectedData.ejdw), getZjly(selectedData.ejdw)]);
  gkbmListData.value.push(...gkbmList.data);
  zjlyData.value = zjly.data;
  matterBaseMsg.zjly = zjly.data.code;
  ejdwListData.value.push(...yjdwList.data);
  getGkbmXzHandle(selectedData.zgkbmId);
  loading.value = true;
  matterBaseMsg.id = selectedData.id;
  matterBaseMsg.zyssxmc = selectedData.yssxmc;
  matterBaseMsg.yjdw = selectedData.yjdw;
  matterBaseMsg.ejdw = selectedData.ejdw;
  matterBaseMsg.xmlx = selectedData.xmlx;
  matterBaseMsg.yslxctId = selectedData.yslxctId;
  matterBaseMsg.isYap = selectedData.isYap;
  matterBaseMsg.zgkbmId = selectedData.zgkbmId;
  matterBaseMsg.remark = selectedData.remark;
  matterBaseMsg.sxys = selectedData.sxys;
  matterChangeMsg.value.bgje = selectedData.sxys;
  matterBaseMsg.csId = selectedData.csId;
  matterBaseMsg.nd = selectedData.nd;
  matterBaseMsg.middleId = selectedData.middleId;
  matterBaseMsg.xmlxList = selectedData.middleId;
  if (props.baseMsgData.operationFlag === "ADD") {
    let ssdwTable = await getFyxxByYssxId(selectedData.yssxId);
    unitTableData.value = ssdwTable.data;
  } else {
    let [fyxx, sqdxx] = await Promise.all([getFyxxById(selectedData.id), getSqdxxById(selectedData.id)]);
    if (fyxx.success && sqdxx.success) {
      unitTableData.value = fyxx.data;
      matterChangeMsg.value.bgsj = sqdxx.data.bgsj;
      matterChangeMsg.value.bgsqdh = sqdxx.data.bgsqdh;
      matterChangeMsg.value.bgr = sqdxx.data.bgr;
      matterChangeMsg.value.bgyy = sqdxx.data.bgyy;
      matterChangeMsg.value.id = sqdxx.data.id;
      matterChangeMsg.value.bgnr = sqdxx.data.bgnr;
    }
    unitTableData.value = fyxx.data;
  }
  loading.value = false;
};

const projectTypeListData = ref<any>();

const bgnrList = ref<BGNR[]>([]);

const matterChangeMsg = ref({
  id: "",
  bgje: "",
  bgnr: "",
  bgsqdh: "",
  bgyy: "",
  bgr: "",
  bgsj: ""
});

const matterBaseMsg = reactive({
  id: "",
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
  middleId: ""
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
  unitTableData.value.length = 0;
  loading.value = true;
  if (val) {
    let res = await getEjdwList({
      parentId: val,
      specialorgid: props.baseMsgData.specialOrgId
    });
    if (res.success) {
      ejdwListData.value.push(...res.data);
      loading.value = false;
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
  unitTableData.value.length = 0;
  if (val) {
    let ssdwTable = await getSsdw({
      ejdw: val,
      specialorgid: props.baseMsgData.specialOrgId
    });
    unitTableData.value = ssdwTable.data;
    let [gkbmList, zjly] = await Promise.all([getGkbmByEjdw(val), getZjly(val)]);
    if (gkbmList.success && zjly.success) {
      gkbmListData.value.push(...gkbmList.data);
      zjlyData.value = zjly.data;
      matterBaseMsg.zjly = zjly.data.code;
    } else {
      ElMessage({
        type: "error",
        message: "请求错误,请重新再试"
      });
    }
    loading.value = false;
  } else {
    loading.value = false;
  }
};

const getBgyyData = async () => {
  loading.value = true;
  let res = await getPublicData("ZLYS_YSSXBGNR");
  if (res.success) {
    bgnrList.value = res.data;
    matterChangeMsg.value.bgnr = res.data[0].code;
  } else {
    ElMessage({
      type: "error",
      message: res.msg
    });
  }
  loading.value = false;
};

const getBgsqdhData = async () => {
  loading.value = true;
  let res = await getSqdh();
  if (res.success) {
    matterChangeMsg.value.bgsqdh = res.data;
  } else {
    ElMessage({
      type: "error",
      message: res.msg
    });
  }
  loading.value = false;
};

const getYslxctData = async (middleId: string, gkbmId: string) => {
  if (!middleId || !gkbmId) {
    return;
  }
  loading.value = true;
  let res = await getYslxct(gkbmId, middleId);
  if (res.success) {
    yslxctData.value = res.data.map((item: any) => {
      return {
        value: item.id,
        label: item.ctmc
      };
    });
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

const blurHandle = ({ row }: List) => {
  if (matterBaseMsg.zjly === "0" && (row.tzhys < row.yfjje || row.tzhys < row.ylxje)) {
    ElMessage.warning("调整后费用安排不超过已分解金额和已立项金额!");
    row.tzhys = "";
    row.tzys = "";
    return;
  }

  if (matterBaseMsg.zjly !== "0" && row.tzhys < row.ylxje) {
    ElMessage.warning("调整后费用安排不超过已立项金额!");
    row.tzhys = "";
    row.tzys = "";
    return;
  }
};

const inputChange = (event: any, { row }: List) => {
  event.target.value = "" + event.target.value;
  event.target.value =
    event.target.value
      .replace(/[^\d^.-]+/g, "") // 包括负号的匹配
      .replace(/^0+(\d)/, "$1")
      .replace(/^\./, "0.")
      .match(/^[-]?\d{0,12}(?:\.\d{0,6})?/)[0] || "";

  let num1 = event.target.value ? event.target.value : "0";
  let num2 = row.dqys ? row.dqys : "0";
  row.tzys = Decimal.sub(parseFloat(num1), parseFloat(num2)).toString();
};

const getGkbmXzHandle = async (val: string) => {
  getProjectData(val);
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
  let data: MsgData = gkbmListData.value.filter((item: MsgData) => item.code === val);
  matterBaseMsg.zgkbmXz = data.unicode as string;
};

const getSummaries = (params: any) => {
  const { columns, data } = params;
  const sums: any = [];
  columns.forEach((column: any, index: any) => {
    if (index === 0) {
      sums[index] = "合计";
      return;
    }
    const values = data.map((item: any) => item[column.property]);
    if (!values.every((value: any) => isNaN(value) && value !== "")) {
      sums[index] = values.reduce((prev: any, curr: any) => {
        let value = curr;
        if (!isNaN(value)) {
          if (!value) value = 0;
          return Decimal.add(prev, value).toString();
        } else {
          return prev;
        }
      }, 0);
      sums[index] += "";
    } else {
      sums[index] = "";
    }
  });
  matterChangeMsg.value.bgje = sums[2];
  return sums;
};

const getXmlxHandle = (val: any[]) => {
  const newVal = [...val];
  matterBaseMsg.xmlx = newVal.pop();
};

const submitHandle = async () => {
  loading.value = true;
  let params = {
    ...matterChangeMsg.value,
    childs: unitTableData.value,
    yssxId: props.baseMsgData.selectedData.yssxId
  };
  let res = await saveData(params);
  if (res.success) {
    if (!matterChangeMsg.value.id) {
      matterChangeMsg.value.id = res.data;
      let [fyxx, sqdxx] = await Promise.all([getFyxxById(res.data), getSqdxxById(res.data)]);
      if (fyxx.success && sqdxx.success) {
        unitTableData.value = fyxx.data;
        matterChangeMsg.value.bgsj = sqdxx.data.bgsj;
        matterChangeMsg.value.bgr = sqdxx.data.bgr;
      } else {
        ElMessage.error("保存失败!");
      }
    }
    emits.emit("getMatterChangeMsg", {
      matterBaseMsg: matterChangeMsg.value
    });
    ElMessage.success("保存成功!");
    // 更新页面
    loading.value = false;
  } else {
    let msg = res.msg.includes("|") ? res.msg.split("|").join("<br/>") : res.msg;
    ElMessage({
      type: "error",
      dangerouslyUseHTMLString: true,
      message: msg
    });
    loading.value = false;
  }
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
  position: relative;

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
