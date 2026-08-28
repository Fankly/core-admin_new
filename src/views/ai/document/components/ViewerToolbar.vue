<template>
  <div class="viewer-toolbar">
    <span class="viewer-toolbar__status"><i aria-hidden="true"></i>{{ label }}</span>
  </div>
</template>

<script setup lang="ts">
defineProps({
  label: {
    type: String,
    required: true
  }
})
</script>

<style scoped lang="less">
.viewer-toolbar {
  position: sticky;
  top: 0;
  z-index: 2;
  display: flex;
  flex-shrink: 0;
  align-items: center;
  min-height: 38px;
  padding: 0 14px;
  border-bottom: 1px solid #e4e7ec;
  background: rgb(248 250 252 / 96%);
  backdrop-filter: blur(4px);

  &__status {
    display: inline-flex;
    align-items: center;
    color: #344054;
    font-size: 12px;
    font-weight: 600;

    i {
      width: 7px;
      height: 7px;
      margin-right: 7px;
      border-radius: 50%;
      background: #0f766e;
      box-shadow: 0 0 0 3px rgb(15 118 110 / 12%);
    }
  }
}
</style>
