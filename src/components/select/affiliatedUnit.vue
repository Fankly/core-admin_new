<template>
  <el-cascader
    ref="myCascader"
    :checkStrictly="true"
    :props="{ multiple: true }"
    :options="projects"
    :show-all-levels="false"
    collapse-tags
    @change="handle"
    clearable
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
      allId: []
    })
  },

  methods: {
    clear() {
      this.$refs.myCascader.$refs.panel.checkedValue = []
      this.$refs.myCascader.$refs.panel.activePath = []
      this.$refs.myCascader.$refs.panel.clearCheckedNodes()
      this.handle()
    },
    setCheckedByCode(code) {
      if (!code) {
        return Promise.resolve(false)
      }
      return new Promise((resolve) => {
        this.$nextTick(() => {
          const panel = this.$refs.myCascader?.$refs?.panel
          if (!panel || !this.projects.length) {
            resolve(false)
            return
          }

          const matchNode = panel.getFlattedNodes(false).find((node) => {
            const nodeCode = node.data?.code
            return String(nodeCode) === String(code)
          })

          if (!matchNode) {
            resolve(false)
            return
          }

          panel.clearCheckedNodes()
          matchNode.doCheck(true)
          panel.calculateCheckedValue()
          this.handle()
          resolve(true)
        })
      })
    },
    //处理数据
    handle() {
      let array = []
      const getCheck = this.$refs.myCascader.getCheckedNodes()
      if (getCheck.length > 0) {
        getCheck.forEach((item) => {
          if (array.indexOf(item.data.code) == -1) {
            array.push(item.data.code)
          }
          if (item.parent) {
            if (array.indexOf(item.parent.data.code) == -1) {
              array.push(item.parent.data.code)
            }
          }
        })
        this.selectList = array
      } else {
        this.selectList = []
      }
    },

    //获取所属单位数据
    getAffiliatedUnit(specialorgid) {
      return baseService.get(`/process/code/getDept?specialorgid=${specialorgid}`).then((res) => {
        if (res.success == true) {
          this.projects = process.optionHandleDept(res.data)
          this.allId = []
          this.projects.forEach((item) => {
            this.allId.push(item.code)
            if (item.children) {
              item.children.forEach((e) => {
                this.allId.push(e.code)
                if (e.children) {
                  e.children.forEach((row) => {
                    this.allId.push(row.code)
                    if (row.children) {
                      row.children.forEach((val) => {
                        this.allId.push(val.code)
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
