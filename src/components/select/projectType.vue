<template>
  <el-cascader
    ref="myCascader"
    :props="{ multiple: true }"
    :options="projects"
    :show-all-levels="false"
    collapse-tags
    clearable
    @change="handle"
  ></el-cascader>
</template>

<script>
import { defineComponent, reactive } from 'vue'
import { ElMessage } from 'element-plus'
import process from '@/views/budget-process/js/process-data'
import baseService from '@/service/baseService'
export default defineComponent({
  setup() {
    return reactive({
      projects: [],
      //选中数据 页面直接调用即可
      selectList: [],

      //不勾选默认转所有id
      allId: [],
      projectTypePromise: null
    })
  },
  created() {
    this.projectTypePromise = this.getProjectType()
  },

  methods: {
    clear() {
      this.$refs.myCascader.$refs.panel.checkedValue = []
      this.$refs.myCascader.$refs.panel.activePath = []
      this.$refs.myCascader.$refs.panel.clearCheckedNodes()
      this.handle()
    },
    //处理数据
    handle(value) {
      let array = []
      //处理项目类型
      if (value) {
        value.forEach((item) => {
          array.push(item[item.length - 1])
        })
        this.selectList = array
      } else {
        this.selectList = []
      }
    },
    setCheckedById(id) {
      if (!id) {
        return Promise.resolve(false)
      }

      const waitProjectType = this.projects.length ? Promise.resolve() : this.projectTypePromise || this.getProjectType()
      return waitProjectType.then(() => {
        return new Promise((resolve) => {
          this.$nextTick(() => {
            const panel = this.$refs.myCascader?.$refs?.panel
            if (!panel || !this.projects.length) {
              resolve(false)
              return
            }

            const matchNode = panel.getFlattedNodes(false).find((node) => {
              return String(node.data?.id) === String(id) || String(node.data?.value) === String(id)
            })

            if (!matchNode) {
              resolve(false)
              return
            }

            panel.clearCheckedNodes()
            matchNode.doCheck(true)
            panel.calculateCheckedValue()
            this.handle(panel.checkedValue)
            resolve(true)
          })
        })
      })
    },

    //获取项目类型数据
    getProjectType() {
      return baseService.get('/process/code/getType').then((res) => {
        if (res.success == true) {
          this.projects = process.optionHandleType(res.data)
          this.projects.forEach((item) => {
            this.allId.push(item.id)
            if (item.children) {
              item.children.forEach((e) => {
                this.allId.push(e.id)
                if (e.children) {
                  e.children.forEach((row) => {
                    this.allId.push(row.id)
                    if (row.children) {
                      row.children.forEach((val) => {
                        this.allId.push(val.id)
                      })
                    }
                  })
                }
              })
            }
          })
        } else {
          ElMessage({
            type: 'error',
            message: res.msg
          })
        }
      })
    }
  }
})
</script>
<style lang="less" scoped></style>
