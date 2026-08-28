<template>
  <el-dialog v-model="visible" :title="!dataForm.id ? '新增' : '修改'" :close-on-click-modal="false" :close-on-press-escape="false" class="dialogBox">
    <el-form :model="dataForm" :rules="dataRule" ref="dataFormRef" @keyup.enter="dataFormSubmitHandle()" label-width="120px">
      <el-form-item prop="type" label="类型" size="mini">
        <el-radio-group v-model="dataForm.type" :disabled="!!dataForm.id">
          <el-radio :label="0">{{ '菜单' }}</el-radio>
          <el-radio :label="1">{{ '按钮' }}</el-radio>
        </el-radio-group>
      </el-form-item>
      <el-form-item prop="name" label="名称">
        <el-input v-model="dataForm.name" placeholder="名称"></el-input>
      </el-form-item>
      <el-form-item prop="parentName" label="上级菜单" class="menu-list">
        <el-popover v-model:visible="menuListVisible" ref="menuListPopover" placement="bottom-start" trigger="click" :width="'400px'">
          <template v-slot:reference>
            <el-input v-model="dataForm.parentName" :readonly="true" placeholder="请选择菜单">
              <template v-slot:suffix
                ><i v-if="dataForm.pid !== '0'" @click.stop="deptListTreeSetDefaultHandle()" class="el-icon-circle-close el-input__icon"></i
              ></template>
            </el-input>
          </template>
          <el-tree
            :data="menuList"
            :props="{ label: 'name', children: 'children' }"
            node-key="id"
            ref="menuListTree"
            :highlight-current="true"
            :expand-on-click-node="false"
            accordion
            @current-change="menuListTreeCurrentChangeHandle"
          ></el-tree>
        </el-popover>
      </el-form-item>
      <el-form-item v-if="dataForm.type === 0" prop="url" label="路由">
        <el-input v-model="dataForm.url" placeholder="路由"></el-input>
      </el-form-item>
      <el-form-item prop="sort" label="排序">
        <el-input-number v-model="dataForm.sort" controls-position="right" :min="0" label="排序"></el-input-number>
      </el-form-item>
      <el-form-item v-if="dataForm.type === 0" prop="openStyle" label="打开方式" size="mini">
        <el-radio-group v-model="dataForm.openStyle">
          <el-radio :label="0">{{ '内部打开' }}</el-radio>
          <el-radio :label="1">{{ '外部打开' }}</el-radio>
        </el-radio-group>
      </el-form-item>
      <el-form-item prop="isShow" label="是否显示菜单" size="mini">
        <el-radio-group v-model="dataForm.isShow">
          <el-radio :label="1">{{ '是' }}</el-radio>
          <el-radio :label="0">{{ '否' }}</el-radio>
        </el-radio-group>
      </el-form-item>
      <el-form-item prop="isMainPage" label="是否主页" size="mini">
        <el-radio-group v-model="dataForm.isMainPage">
          <el-radio :label="1">{{ '是' }}</el-radio>
          <el-radio :label="0">{{ '否' }}</el-radio>
        </el-radio-group>
      </el-form-item>
      <el-form-item v-if="dataForm.type === 0" prop="icon" label="图标" class="icon-list">
        <el-popover
          :width="'400px'"
          v-model:visible="iconListVisible"
          ref="iconListPopover"
          placement="top-start"
          trigger="click"
          popper-class="mod-sys__menu-icon-popover"
        >
          <template v-slot:reference>
            <el-input v-model="dataForm.icon" readonly placeholder="请选择图标" aria-label="菜单图标">
              <template #prefix>
                <svg v-if="dataForm.icon" class="icon-preview" aria-hidden="true">
                  <use :xlink:href="'#' + dataForm.icon"></use>
                </svg>
              </template>
              <template #suffix>
                <button
                  v-if="dataForm.icon"
                  type="button"
                  class="icon-clear-button"
                  aria-label="清除图标"
                  title="清除图标"
                  @click.stop="clearIconHandle"
                >
                  <i class="el-icon-circle-close" aria-hidden="true"></i>
                </button>
                <i v-else class="el-icon-arrow-down" aria-hidden="true"></i>
              </template>
            </el-input>
          </template>
          <div class="mod-sys__menu-icon-inner">
            <div class="mod-sys__menu-icon-list">
              <el-button
                v-for="(item, index) in iconList"
                :key="item || index"
                native-type="button"
                :aria-label="'选择图标 ' + item"
                :title="'选择图标 ' + item"
                @click="iconListCurrentChangeHandle(item)"
                :class="{ 'is-active': dataForm.icon === item }"
              >
                <svg class="icon-svg" aria-hidden="true">
                  <use :xlink:href="`#${item}`"></use>
                </svg>
              </el-button>
            </div>
          </div>
        </el-popover>
      </el-form-item>
      <el-form-item class="icon-list" label="菜单配置">
        <el-cascader clearable v-model="dataForm.outsideMenu" :options="treeList" :props="cascaderProps" :show-all-levels="false" @change="handle" />
      </el-form-item>
      <el-form-item prop="isFrame" label="是否内嵌" size="mini">
        <el-radio-group v-model="dataForm.isFrame">
          <el-radio :label="1">{{ '是' }}</el-radio>
          <el-radio :label="0">{{ '否' }}</el-radio>
        </el-radio-group>
      </el-form-item>
      <el-form-item v-if="dataForm.isFrame" prop="frameSrc" label="内嵌地址" size="mini">
        <el-input v-model="dataForm.frameSrc" placeholder="请输入内嵌地址"></el-input>
      </el-form-item>
    </el-form>
    <template v-slot:footer>
      <el-button @click="visible = false">{{ '取消' }}</el-button>
      <el-button type="primary" :loading="submitLoading" @click="dataFormSubmitHandle()">{{ '确定' }}</el-button>
    </template>
  </el-dialog>
</template>

<script lang="ts">
import useView from '@/hooks/useView'
import { defineComponent, reactive, toRefs, watch } from 'vue'
import baseService from '@/service/baseService'
import { getIconList, useDebounce } from '@/utils/utils'
import { IObject } from '@/types/interface'
import { useStore } from 'vuex'

export default defineComponent({
  setup() {
    const store = useStore()
    const state = reactive({
      visible: false,
      menuList: [],
      menuListVisible: false,
      iconList: [] as string[],
      iconListVisible: false,
      submitLoading: false,
      treeList: [],
      cascaderProps: {
        label: 'title',
        value: 'label',
        children: 'children'
      },
      dataForm: {
        id: '',
        isFrame: 0,
        frameSrc: '',
        type: 0,
        name: '',
        pid: '0',
        parentName: '',
        url: '',
        isShow: 1,
        isMainPage: 0,
        sort: 0,
        icon: '',
        openStyle: 0,
        outsideMenu: ''
      }
    })
    // 监听isFrame
    watch(
      () => state.dataForm.isFrame,
      (newVal) => {
        if (newVal === 0) {
          state.dataForm.frameSrc = ''
        }
      }
    )

    return { ...useView(state), ...toRefs(state), store }
  },
  computed: {
    dataRule() {
      return {
        name: [{ required: true, message: '必填项不能为空', trigger: 'blur' }],
        parentName: [{ required: true, message: '必填项不能为空', trigger: 'change' }]
      }
    }
  },
  created() {
    this.dataFormSubmitHandle = useDebounce(this.dataFormSubmitHandle)
    this.getUserList()
  },
  methods: {
    getUserList() {
      const id = this.store.getters.getUserMsg.id
      baseService.get(`/sys/getUserMenuTree?userId=${id}`).then((res) => {
        if (res.success) {
          this.treeList = res.data
        }
      })
    },
    handle(value: any) {
      if (!value) this.dataForm.outsideMenu = ''
      else this.dataForm.outsideMenu = value[value.length - 1]
    },
    init(patientRow?: IObject) {
      this.visible = true
      this.$nextTick(() => {
        this.$refs['dataFormRef'].resetFields()
        this.iconList = getIconList()
        if (patientRow) {
          this.dataForm.id = ''
          this.dataForm.pid = patientRow.id
          this.dataForm.parentName = patientRow.name
        } else {
          this.dataForm.parentName = '项目过程管控平台'
        }
        this.getMenuList().then(() => {
          if (this.dataForm.id) {
            this.getInfo()
          }
        })
      })
    },
    // 获取菜单列表
    getMenuList() {
      return baseService.get('/sys/menu/list?type=0').then((res) => {
        if (res.code !== 0) {
          return this.$message.error(res.msg)
        }
        this.menuList = res.data
      })
    },
    // 获取信息
    getInfo() {
      baseService.get(`/sys/menu/${this.dataForm.id}`).then((res) => {
        if (res.code !== 0) {
          return this.$message.error(res.msg)
        }
        this.dataForm = {
          ...this.dataForm,
          ...res.data
        }
        if (this.dataForm.pid === '0') {
          return this.deptListTreeSetDefaultHandle()
        }
        this.$refs.menuListTree.setCurrentKey(this.dataForm.pid)
      })
    },
    // 上级菜单树, 设置默认值
    deptListTreeSetDefaultHandle() {
      this.dataForm.pid = '0'
      this.dataForm.parentName = '项目过程管控平台'
    },
    // 上级菜单树, 选中
    menuListTreeCurrentChangeHandle(data: IObject) {
      this.dataForm.pid = data.id
      this.dataForm.parentName = data.name
      this.menuListVisible = false
    },
    // 图标, 选中
    iconListCurrentChangeHandle(icon: string) {
      this.dataForm.icon = icon
      this.iconListVisible = false
    },
    clearIconHandle() {
      this.dataForm.icon = ''
      this.iconListVisible = false
    },
    // 表单提交
    dataFormSubmitHandle() {
      if (this.submitLoading) {
        return
      }
      this.$refs['dataFormRef'].validate((valid: boolean) => {
        if (!valid) {
          return false
        }
        this.submitLoading = true
        const url = this.dataForm.id ? '/sys/menu/update' : '/sys/menu'
        baseService
          .post(url, this.dataForm)
          .then((res) => {
            if (res.code !== 0) {
              return this.$message.error(res.msg)
            }
            this.$message({
              message: '操作成功',
              type: 'success',
              duration: 500,
              onClose: () => {
                this.visible = false
                this.$emit('refreshDataList')
              }
            })
          })
          .finally(() => {
            this.submitLoading = false
          })
      })
    }
  }
})
</script>

<style lang="less" scoped>
.el-select--small {
  width: 100%;
}
.el-popover.el-popper {
  overflow-x: hidden;
}

.mod-sys__menu {
  .menu-list,
  .icon-list {
    .el-input__inner,
    .el-input__suffix {
      cursor: pointer;
    }
  }

  &-icon-popover {
    width: 458px !important;
    overflow-y: hidden !important;
  }

  &-icon-inner {
    width: 478px;
    max-height: 258px;
    overflow-x: hidden;
    overflow-y: auto;
  }

  &-icon-list {
    width: 458px !important;
    padding: 0;
    margin: -8px 0 0 -8px;

    > .el-button {
      padding: 8px;
      margin: 8px 0 0 8px;

      > span {
        display: inline-block;
        vertical-align: middle;
        width: 18px;
        height: 18px;
        font-size: 15px;
      }
    }
  }
}

.icon-preview {
  width: 15px;
  height: 15px;
}

.icon-clear-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  padding: 0;
  color: #909399;
  background: transparent;
  border: 0;
  cursor: pointer;

  &:hover,
  &:focus-visible {
    color: #00706b;
    outline: none;
  }
}
</style>
