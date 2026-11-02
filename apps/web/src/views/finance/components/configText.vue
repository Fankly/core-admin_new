<template>
  <div class="configText configText__view">
    <div
      :style="{ ...itemStyle, 'align-items': `${item.isImage ? 'flex-start' : ''}`, flex: `${itemWidth ? `0 0 calc(${itemWidth} - 20px)` : ''}` }"
      :key="index"
      v-for="(item, index) in options"
      :class="`configText__view--item ${item.isRow ? 'row' : ''}`"
    >
      <div class="configText__view--item__label">{{ item.label }}：</div>
      <span v-if="item.isCopy" style="cursor: pointer; margin-right: 5px" @click.stop="() => $utils.textToCopy(getText(item))">
        <el-icon style="color: #51afeb" class="ep-icon-document-copy"><EpDocumentCopy /></el-icon>
      </span>
      <div :class="`configText__view--item__text ${item.danger && 'danger--color'}`">
        <el-tag
          :class="item.tagClass"
          :type="item.propDict?.getValue(item.valueFormatter ? item.valueFormatter(dataValue[item.prop]) : dataValue[item.prop], 'type')"
          v-if="item.propDict && dataValue[item.prop] != null"
        >
          {{ item.propDict?.getValue(item.valueFormatter ? item.valueFormatter(dataValue[item.prop]) : dataValue[item.prop]) }}
        </el-tag>
        <!-- <el-image v-else-if="item.isImage" :preview-src-list="[getImageUrl(dataValue[item.prop])]" style="width: 100px; height: 100px" :src="getImageUrl(dataValue[item.prop])" :fit="item.imageUrlFit || 'contain'"></el-image> -->
        <TextOverHiddenTooltip :link="item.link" :wrapNumber="item.wrapNumber || wrapNumber" v-else :text="getText(item)"> </TextOverHiddenTooltip>
      </div>
    </div>
  </div>
</template>

<script setup>
import { DocumentCopy as EpDocumentCopy } from '@element-plus/icons-vue'
import { useUpload } from '@/core/composables/useWorkspace'
import { proxyRefs, toRef, reactive, toRefs } from 'vue'
defineOptions({
  name: 'configText'
})
const componentProps = defineProps({
  options: [],
  config: {
    type: Object,
    default: () => ({})
  },
  itemStyle: {
    type: [String, Object],
    default: ''
  },
  itemWidth: {
    type: String,
    default: ''
  },
  wrapNumber: {
    type: Number,
    default: 1
  },
  dataValue: Object
})
const UploadState = proxyRefs(useUpload())
const parseUploadData = toRef(UploadState, 'parseUploadData')
const getPictureList = toRef(UploadState, 'getPictureList')
const fileListToJson = toRef(UploadState, 'fileListToJson')
const getUploadFileUrl = toRef(UploadState, 'getUploadFileUrl')
const filterEmptyValues = toRef(UploadState, 'filterEmptyValues')
const getUploadFileUrlByFetch = toRef(UploadState, 'getUploadFileUrlByFetch')
const getUploadActionUrl = toRef(UploadState, 'getUploadActionUrl')
const pictureFile = toRef(UploadState, 'pictureFile')
const getUploadHeaders = toRef(UploadState, 'getUploadHeaders')
const componentData = reactive({})
// getImageUrl (url) {
//   if (url) {
//     let temp = this.getUploadFileUrl({downloadUri: '/admin/commonext/util/downloadImage'}, {
//       filename: url
//     });
//     return temp;
//   } else {
//     return null;
//   }
// },
function getText(item) {
  const value = item.formatter ? item.formatter(componentProps.dataValue[item.prop]) : componentProps.dataValue[item.prop]
  return value === null || value === undefined || value === '' ? '-' : value
}
defineExpose({
  EpDocumentCopy,
  parseUploadData,
  getPictureList,
  fileListToJson,
  getUploadFileUrl,
  filterEmptyValues,
  getUploadFileUrlByFetch,
  getUploadActionUrl,
  pictureFile,
  getUploadHeaders,
  getText,
  ...toRefs(componentData)
})
</script>
<style lang="less" scoped>
.configText__view {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-start;
  height: 100%;
  &--item {
    &.row {
      flex: 0 0 calc(100% - 20px) !important;
    }
    flex: 0 0 calc(20% - 20px);
    height: 0;
    // height: 45px;
    width: 0;
    display: flex;
    align-items: center;
    margin-right: 20px;
    margin-top: 20px;
    &__text {
      flex: 1;
      overflow: hidden;
    }
  }
}
</style>
