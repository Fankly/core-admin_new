<script lang="ts">
export default {
  name: "/service/xq/Province"
};
</script>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { exportXqjdDataByRole, getXqjdDataByRole, pass, reject } from "@/api/service/requirement";
import { ElMessage } from "element-plus";
import VXETable from "vxe-table";
import { useStore } from "vuex";

import { getAppMenu } from "@/api/menu/menuConfig";
import userDialog from "@/components/select/userDialog.vue";
import { MenuConfig } from "@/views/service/xq/interface";
import baseService from "@/service/baseService";
import { useRouter,useRoute } from "vue-router";

import { useUser } from "@/hooks/useUser";

const tableRef = ref();
const store = useStore();
const route=useRoute();

const initParams = ref<any>({});
const loading = ref(false);
const isShowPage = ref(false);

const operationBtn = ref<MenuConfig[]>([]);
const searchBtn = ref<MenuConfig[]>([]);
const userInfo = ref<any>({});
const userDialogRef = ref();

const pageData = ref([]);

const page = {
  total: 0,
  limit: 20,
  page: 1
};

const pageChangeHandle = (currentPageNum: number) => {
  page.page = currentPageNum;
  searchDataHandle();
};
const limitChangeHandle = (currentLimitNum: number) => {
  page.page = 1;
  page.limit = currentLimitNum;
  searchDataHandle();
};

const searchDataHandle = async () => {
  try {
    loading.value = true;
    const res = await getXqjdDataByRole({
      dwId: initParams.value.dwId,
      bmId: initParams.value.deptId,
      roleId: initParams.value.roleId,
      page: page.page
    });
    if (res.success) {
      pageData.value = res.data.records;
      page.total = res.data.total;
      loading.value = false;
    } else {
      ElMessage.success(res.msg);
      loading.value = false;
    }
  } catch (e) {
    loading.value = false;
    console.error(e);
  }
};

const passHandle = async () => {
  try {
    const $grid = tableRef.value;
    if ($grid) {
      const records = $grid.getCheckboxRecords();
      if (records && records.length === 0) {
        ElMessage.warning("请选择至少一条数据进行操作!");
        return;
      }
      const type = await VXETable.modal.confirm("确认是否通过?", "提示", {
        status: "question",
        confirmButtonText: "是",
        cancelButtonText: "否"
      });
      if (type === "confirm") {
        loading.value = true;
        const xmIds = records.map((item: any) => item.id);
        const res = await pass({
          dwId: initParams.value.dwId,
          bmId: initParams.value.deptId,
          roleId: initParams.value.roleId,
          xmIds: xmIds
        });
        if (res.success) {
          ElMessage.success("操作成功!");
          await searchDataHandle();
          loading.value = false;
        } else {
          ElMessage.error(res.msg);
          loading.value = false;
        }
      }
    }
  } catch (e) {
    console.error(e);
    loading.value = false;
  }
};
const rejectHandle = async () => {
  try {
    const $grid = tableRef.value;
    if ($grid) {
      const records = $grid.getCheckboxRecords();
      if (records && records.length === 0) {
        ElMessage.warning("请选择至少一条数据进行操作!");
        return;
      }
      const type = await VXETable.modal.confirm("确认是否驳回?", "提示", {
        status: "question",
        confirmButtonText: "是",
        cancelButtonText: "否"
      });
      if (type === "confirm") {
        loading.value = true;
        const xmIds = records.map((item: any) => item.id);
        const res = await reject({
          dwId: initParams.value.dwId,
          bmId: initParams.value.deptId,
          roleId: initParams.value.roleId,
          xmIds: xmIds
        });
        if (res.success) {
          loading.value = false;
          ElMessage.success("操作成功!");
          await searchDataHandle();
        } else {
          ElMessage.error(res.msg);
          loading.value = false;
        }
      }
    }
  } catch (e) {
    console.error(e);
    loading.value = false;
  }
};

const exportHandle = () => {
  loading.value = true;
  const params = {
    dwId: initParams.value.dwId,
    bmId: initParams.value.deptId,
    roleId: initParams.value.roleId,
    page: page.page
  };
  exportXqjdDataByRole(params).then((res: any) => {
    const blob = res;
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
    loading.value = false;
  });
};

// onMounted(async () => {
//   const xqGlobalInfo = store.getters.getXqGlobalInfo;
//   if (xqGlobalInfo && Object.keys(xqGlobalInfo).length > 0) {
//     initParams.value = {
//       ...xqGlobalInfo
//     };
//     isShowPage.value = true;
//     await searchDataHandle();
//   } else {
//     isShowPage.value = false;
//     ElMessage.error("获取不到当前用户信息,请关闭页面重新尝试");
//   }
// });
const getRoleHandle = async () => {
  try {
    const isQuery = userDialogRef.value.isQuery;
    userInfo.value = { ...userDialogRef.value.userMsg };
    if (isQuery) {
      isShowPage.value = true;
      const flagData = await baseService.post(`/workflow/cbxqsh/getFqzz?spOrgId=${userInfo.value.specialorgid}`);
      if (flagData.success && flagData.data) {
        store.commit("setXqGlobalInfo", {
          deptId: userInfo.value.specialorgid,
          deptName: userInfo.value.specialorgname,
          dwId: userInfo.value.org_id,
          dwName: userInfo.value.org_name,
          roleId: userInfo.value.role_id,
          roleCode: userInfo.value.code,
          spRoleId: userInfo.value.id,
          specialorgcode: userInfo.value.specialorgcode,
          fqzzFlag: flagData.data
        });
        const xqGlobalInfo = store.getters.getXqGlobalInfo;
        if (xqGlobalInfo && Object.keys(xqGlobalInfo).length > 0) {
          isShowPage.value = true;
          initParams.value = {
            ...xqGlobalInfo
          };
          searchDataHandle();
        }
      }
    }
  } catch (e) {
    console.error(e);
  }
};
onMounted(async () => {
  var isRoel = await useUser();

  if (isRoel && route.params.formJsc) {
    isShowPage.value = true;
    const xqGlobalInfo = store.getters.getXqGlobalInfo;
    initParams.value = {
      ...xqGlobalInfo
    };
    searchDataHandle();
  } else {
    const operationRes = await getAppMenu({
      appNo: "XQK",
      label: "1"
    });
    const searchRes = await getAppMenu({
      appNo: "XQK",
      label: "2"
    });
    if (operationRes.success && searchRes.success) {
      operationBtn.value = operationRes.data;
      searchBtn.value = searchRes.data;
    }
    await userDialogRef.value.getUser();
  }
});
</script>

<template>
  <div class="container" v-loading="loading" v-if="isShowPage">
    <div class="search">
      <el-button type="primary" size="mini" plain v-debounce="[passHandle, `click`, 300]">通 过</el-button>
      <el-button type="primary" size="mini" plain v-debounce="[rejectHandle, `click`, 300]">驳 回</el-button>
      <el-button type="primary" size="mini" plain v-debounce="[exportHandle, `click`, 300]">导 出</el-button>
    </div>
    <div class="table">
      <vxe-table 
        ref="tableRef"
        border
        resizable
        show-overflow
        align="center"
        header-align="center"
        :row-config="{
          height: 32
        }"
        :data="pageData"
        height="100%"
      >
        <vxe-column type="checkbox" width="80"></vxe-column>
        <vxe-column title="项目编码" field="xmbm"></vxe-column>
        <vxe-column title="项目名称" field="xmmc"></vxe-column>
        <vxe-column title="项目类型" field="xmlxName"></vxe-column>
        <vxe-column title="重点投向" field="zdtxName"></vxe-column>
        <vxe-column title="预算事项" field="yssxName"></vxe-column>
        <vxe-column title="三级分类" field="sjflName"></vxe-column>
        <vxe-column title="一级单位" field="yjdwName"></vxe-column>
        <vxe-column title="二级单位" field="ejdwName"></vxe-column>
        <vxe-column title="成本中心" field="cbzxName"></vxe-column>
        <vxe-column title="创建时间" field="createTime"></vxe-column>
      </vxe-table>
    </div>
    <div class="pager">
      <el-pagination :current-page="page.page" background align="center" :page-sizes="[10, 20, 50, 100, 500]" :page-size="page.limit" :total="parseInt(page.total + '')" layout="total, sizes, prev, pager, next, jumper" @size-change="limitChangeHandle" @current-change="pageChangeHandle"></el-pagination>
    </div>
  </div>
  <userDialog ref="userDialogRef" @loadCompany="getRoleHandle"></userDialog>
</template>

<style scoped lang="less">
.container {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 10px;
  .table {
    padding-top: 10px;
    flex: 1;
    min-width: 0;
    min-height: 0;
  }
}
</style>
