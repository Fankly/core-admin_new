<template>
  <div class="table-box" v-loading="loading" v-if="isShowPage">
    <ProTable :data-callback="dataCallbackHandle" @reset="resetParams" :pagination="true" :requestApi="getDataList" :search-col="4" ref="proTable" :columns="columns" :init-param="initParam" @darg-sort="sortTable">
      <!-- 表格 header 按钮 -->
      <template #tableHeader="scope">
        <el-button v-permission="'ADD'" size="mini" type="primary" plain @click="addMsg">新 增</el-button>
        <el-button v-permission="'EDIT'" size="mini" :disabled="!scope.isSelected" type="primary" plain @click="editMsg(scope.selectedList)">修 改 </el-button>
        <el-button v-permission="'DELETE'" size="mini" :disabled="!scope.isSelected" type="danger" plain @click="delMsg(scope.selectedListIds)"> 删 除 </el-button>
        <el-button v-permission="'IMPORT'" size="mini" type="primary" plain @click="importMsg">导 入</el-button>
        <el-button v-permission="'EXPORT'" size="mini" type="primary" plain @click="exportMsg">导 出</el-button>
      </template>
    </ProTable>
    <el-dialog title="基本信息" v-model="isShowDialog">
      <el-form v-loading="dialogLoading" ref="ruleFormRef" :rules="dialogFormRules" :model="dialogForm" label-position="right" :label-width="100">
        <el-row :gutter="24">
          <el-col :span="12">
            <el-form-item prop="yjdw" label="一级单位：">
              <el-select :clearable="false" style="width: 100%" @change="getDialogEjdwData" v-model="dialogForm.yjdw">
                <el-option v-for="item in yjdwListData" :key="item.code" :label="item.name" :value="item.code">
                  {{ item.name }}
                </el-option>
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item prop="ejdw" label="二级单位：">
              <el-select :clearable="false" style="width: 100%" v-model="dialogForm.ejdw">
                <el-option v-for="item in dialogejdwListData" :key="item.code" :label="item.name" :value="item.code">
                  {{ item.name }}
                </el-option>
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="24">
          <el-col :span="12">
            <el-form-item prop="gds" label="供电所：">
              <el-input v-model="dialogForm.gds" style="width: 100%"></el-input>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item prop="jsnf" label="建设年份：">
              <el-date-picker :clearable="false" style="width: 100%" format="YYYY" value-format="YYYY" v-model="dialogForm.jsnf" type="year" placeholder="请输入年份"></el-date-picker>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="24">
          <el-col :span="24">
            <el-form-item prop="dz" label="地址：">
              <el-input v-model="dialogForm.dz" resize="none" type="textarea" rows="4" placeholder="请输入地址" />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <template #footer>
        <div class="dialog-footer" style="text-align: center">
          <el-button type="primary" plain @click="submitForm(ruleFormRef)">保 存</el-button>
          <el-button @click="dialogFormClose">关 闭</el-button>
        </div>
      </template>
    </el-dialog>
    <ImportExcel ref="importRef" />
  </div>

  <!-- 权限选择 -->
  <userDialog ref="userDialogRef" @loadCompany="getRoleHandle"></userDialog>
</template>

<script lang="tsx">
export default {
  name: "/matter/process-48"
};
</script>
<script setup lang="tsx">
import { ref, reactive, onMounted } from "vue";
import userDialog from "@/components/select/userDialog.vue";
import { ElMessage, ElMessageBox } from "element-plus";
import ProTable from "@/components/ProTable/index.vue";
import ImportExcel from "@/components/ImportExcel/index.vue";
import { ProTableInstance, ColumnProps } from "@/components/ProTable/interface";
import { getEjdwList, getYjdwList } from "@/api/matter";
import { addMsgData, delMsgData, exportData, getImportTemplate, getPage, importData, updateMsg } from "@/api/matter/powerSupplyStation";
import { cloneDeep } from "lodash";
// 设置用户信息
const loading = ref<boolean>(true);
const isShowPage = ref<boolean>(false);
const specialOrgId = ref<string>("");
const roleCode = ref<string>("");
// userDialog 实例
const userDialogRef = ref<any>();
const importRef = ref();

interface RuleForm {
  yjdw: string;
  ejdw: string;
  gds: string;
  dz: string;
  jsnf: string;
  id?: string;
}

const dialogForm = reactive<RuleForm>({
  yjdw: "",
  ejdw: "",
  gds: "",
  dz: "",
  jsnf: new Date().getFullYear().toString()
});
const ruleFormRef = ref("");
const dialogYjdwListData: any = ref([]);
const dialogejdwListData: any = ref([]);
const getDialogEjdwData = async () => {
  let res: any = await getEjdwList({
    parentId: dialogForm.yjdw,
    specialorgid: specialOrgId.value
  });
  if (res.success) {
    dialogejdwListData.value.length = 0;
    dialogForm.ejdw = "";
    dialogejdwListData.value.push(...res.data);
  }
};
const submitForm = async (formEl: any) => {
  if (!formEl) return;
  await formEl.validate(async (valid: any, fields: any) => {
    if (valid) {
      if (isSaveOrEdit.value === "add") {
        const res = await addMsgData({
          ...dialogForm
        });
        if (res.success) {
          // 提示
          ElMessage.success("保存成功");
          // 关闭弹窗
          dialogFormClose();
        } else {
          ElMessage.error(res.msg);
        }
      } else {
        const res = await updateMsg({
          ...dialogForm
        });
        if (res.success) {
          // 提示
          ElMessage.success("修改成功");
          // 关闭弹窗
          dialogFormClose();
        } else {
          ElMessage.error(res.msg);
        }
      }
      // 刷新表格
      // @ts-ignore
      proTable.value?.clearSelection();
      // @ts-ignore
      proTable.value.search();
    }
  });
};
const dialogFormClose = () => {
  // 清除
  dialogForm.yjdw = "";
  dialogForm.ejdw = "";
  dialogForm.gds = "";
  dialogForm.dz = "";
  if (dialogForm.id) {
    dialogForm.id = "";
  }
  isShowDialog.value = false;
};
const dialogFormRules = reactive({
  yjdw: [{ required: true, message: "请选择一级单位", trigger: "change" }],
  ejdw: [{ required: true, message: "请选择二级单位", trigger: "change" }],
  gds: [{ required: true, message: "请输入供电所", trigger: "blur" }],
  jsnf: [{ required: true, message: "请选择建设年份", trigger: "change" }],
  dz: [{ required: true, message: "请输入地址", trigger: "blur" }]
});
onMounted(() => {
  selectRolesHandle();
});

const selectRolesHandle = () => {
  loading.value = true;
  userDialogRef.value.getUser();
};

const getRoleHandle = () => {
  loading.value = false;
  specialOrgId.value = userDialogRef.value.specialorgid;
  roleCode.value = userDialogRef.value.roleCode;
  initParam.specialorgid = specialOrgId.value;
  initParam.roleCode = roleCode.value;
  getYjdwEnum();
  const isQuery = userDialogRef.value.isQuery;
  if (isQuery) {
    isShowPage.value = true;
  }
};

const isShowDialog = ref<Boolean>(false);
// 新增
const addMsg = () => {
  setYjdwOrEjdwData("add", null);
};

// 编辑
const editMsg = (selectedList: any) => {
  if (selectedList.length !== 1) {
    ElMessage.error("只能选择一条数据进行编辑");
    return;
  }
  setYjdwOrEjdwData("edit", selectedList[0]);
};
const dialogLoading = ref<boolean>(false);
const isSaveOrEdit = ref<string>("");
const setYjdwOrEjdwData = async (flag: string, selectedList: any) => {
  dialogLoading.value = true;
  isShowDialog.value = true;
  isSaveOrEdit.value = flag;
  if (flag === "add") {
    // @ts-ignore
    const yjdw = proTable.value.searchParam.yjdwName;
    // @ts-ignore
    const ejdw = proTable.value.searchParam.ejdwName;
    dialogForm.yjdw = yjdw;
    dialogForm.ejdw = ejdw;
    dialogYjdwListData.value = cloneDeep(yjdwListData.value);
    dialogejdwListData.value = cloneDeep(ejdwListData.value);
    dialogLoading.value = false;
  }
  if (flag === "edit") {
    dialogForm.id = selectedList.id;
    dialogForm.yjdw = selectedList.yjdw;
    dialogForm.gds = selectedList.gds;
    dialogForm.dz = selectedList.dz;
    let res: any = await getEjdwList({
      parentId: selectedList.yjdw,
      specialorgid: specialOrgId.value
    });
    if (res.success) {
      dialogejdwListData.value.length = 0;
      dialogejdwListData.value.push(...res.data);
      dialogForm.ejdw = dialogejdwListData.value.filter((item: any) => item.code === selectedList.ejdw)[0].code;
      dialogLoading.value = false;
    }
  }
};

// 删除
const delMsg = (ids: string[]) => {
  loading.value = true;
  ElMessageBox.confirm("是否删除选中数据", "提示", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "warning"
  })
    .then(async () => {
      const res = await delMsgData(ids);
      if (res.success) {
        loading.value = false;
        ElMessage.success("删除成功");
        // 刷新表格
        // @ts-ignore
        proTable.value?.clearSelection();
        // @ts-ignore
        proTable.value?.search();
      } else {
        loading.value = false;
        ElMessage.error(res.msg);
      }
    })
    .finally(() => {
      loading.value = false;
    });
};

// 导入
const importMsg = () => {
  let params = {
    title: "数据",
    tempApi: getImportTemplate,
    importApi: importData,
    specialorgid: specialOrgId.value,
    // @ts-ignore
    getTableList: proTable.value?.getTableList
  };
  importRef.value.acceptParams(params);
};

// 导出
const exportMsg = () => {
  // @ts-ignore
  exportData({
    specialorgid: specialOrgId.value,
    // @ts-ignore
    ...proTable.value?.searchParam
  }).then((res) => {
    const blob: any = res;
    let dom = document.createElement("a");
    let url = window.URL.createObjectURL(blob);
    dom.href = url;
    // 获取文件名
    let filename = res.headers["content-disposition"].split(";")[1].split("=")[1];
    dom.download = `${decodeURI(decodeURI(filename))}`;
    document.body.appendChild(dom);
    dom.click();
    document.body.removeChild(dom);
    window.URL.revokeObjectURL(url);
  });
};
const resetParams = () => {
  ejdwListData.value.length = 0;
};
// 如果你想在请求之前对当前请求参数做一些操作，可以自定义如下函数：params 为当前所有的请求参数（包括分页），最后返回请求列表接口
// 默认不做操作就直接在 ProTable 组件上绑定	:requestApi="getDataList"
const getDataList = (params: any) => {
  loading.value = true;
  // @ts-ignore
  proTable.value?.clearSelection();
  return getPage(params);
};

const dataCallbackHandle = (data: any) => {
  loading.value = false;
  return data;
};

// ProTable 实例
const proTable = ref<ProTableInstance>();

// 如果表格需要初始化请求参数，直接定义传给 ProTable (之后每次请求都会自动带上该参数，此参数更改之后也会一直带上，改变此参数会自动刷新表格数据)
const initParam: any = reactive({ type: 1 });

// dataCallback 是对于返回的表格数据做处理，如果你后台返回的数据不是 list && total && pageNum && pageSize 这些字段，可以在这里进行处理成这些字段
// 或者直接去 hooks/useTable.ts 文件中把字段改为你后端对应的就行

const yjdwListData: any = ref([]);
const ejdwListData: any = ref([]);

const getYjdwEnum = async () => {
  let res: any = await getYjdwList(specialOrgId.value);
  if (res.success) {
    yjdwListData.value.push(...res.data);
  }
};
const changeEjdwEnum = async (val: string) => {
  ejdwListData.value.length = 0;
  // @ts-ignore
  proTable.value.searchParam.ejdwName = "";
  if (val) {
    let res = await getEjdwList({
      parentId: val,
      specialorgid: specialOrgId.value
    });
    if (res.success) {
      ejdwListData.value.push(...res.data);
    }
  }
};

// 表格配置项
const columns = reactive<ColumnProps<any>[]>([
  { type: "selection", width: 80 },
  {
    prop: "yjdwName",
    label: "一级单位",
    search: { el: "select", props: { onChange: changeEjdwEnum } },
    enum: yjdwListData.value,
    isFilterEnum: false,
    fieldNames: { label: "name", value: "code" }
  },
  {
    prop: "ejdwName",
    label: "二级单位",
    isFilterEnum: false,
    search: { el: "select" },
    enum: ejdwListData.value,
    fieldNames: { label: "name", value: "code" }
  },
  { prop: "gds", label: "供电所", search: { el: "input" } },
  { prop: "jsnf", label: "建设年份" },
  { prop: "dz", label: "地址" },
  { prop: "createTime", label: "创建时间" },
  { prop: "createUser", label: "创建人" },
  { prop: "updateTime", label: "最后一次更新时间" },
  { prop: "updateUser", label: "最后一次更新人" }
]);

// 表格拖拽排序
const sortTable = ({ newIndex, oldIndex }: { newIndex?: number; oldIndex?: number }) => {
  ElMessage.success("修改列表排序成功");
};
</script>
<style scoped lang="less">
.table-box {
  padding: 10px;
}
</style>
