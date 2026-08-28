<template>
  <div class="conclusionView" :style="`${showScroll ? 'overflow: auto;height: 100%' : ''}`">
    <slot name="before" />
    <projectViewItem :dataValue="dataValue" :keyValues="keyValues">
      <template v-slot:supportDoc="{ scope }">
        <div class="text--item" :key="index" v-for="(item, index) in scope.row">
          <el-link @click="download(item.name)" type="primary">{{ item.name }}</el-link>
        </div>
      </template>
      <template v-slot:projectImpact="{ scope }">
        <div class="text--item" :key="index" v-for="(item, index) in scope.row">
          <label>成效{{ index + 1 }}：</label>
          <span>{{ item }}</span>
        </div>
      </template>
    </projectViewItem>
  </div>
</template>
<script>
import projectViewItem from './projectViewItem.vue'

import { CwProjectClosure } from '@/api/mainController'

const isImage = (fileName) => {
  return /\.(png|jpe?g|gif|bmp|webp)$/i.test(fileName)
}

export default {
  components: {
    projectViewItem
  },
  props: {
    projectId: {
      type: String
    },
    showScroll: {
      type: Boolean
    }
  },
  name: 'conclusionView',
  data() {
    return {
      dataValue: undefined
    }
  },
  created() {},
  mounted() {
    this.getInfo()
  },
  methods: {
    download(filename) {
      const obj = {
        id: this.dataValue.id,
        filename,
        fieldName: 'supportDoc',
        asImage: isImage(filename)
      }
      CwProjectClosure.download(this, obj, 'get')
    },
    getInfo() {
      CwProjectClosure.view(this, {
        projectId: this.projectId
      }).then((res) => {
        const { projectImpact, supportDoc, ...otherValues } = res.data
        this.dataValue = {
          projectImpact: JSON.parse(projectImpact),
          supportDoc: JSON.parse(supportDoc).reduce((arr, item) => [...arr, { name: item }], []),
          ...otherValues
        }
      })
    }
  },
  computed: {
    keyValues() {
      return [
        {
          name: '单体项目名称',
          value: 'projectName'
        },
        {
          name: '证明材料',
          value: 'supportDoc',
          slot: true
        },
        {
          name: '项目成效（提升指标）',
          value: 'projectImpact',
          slot: true
        }
      ]
    }
  },
  watch: {}
}
</script>
<style lang="less" scoped></style>
