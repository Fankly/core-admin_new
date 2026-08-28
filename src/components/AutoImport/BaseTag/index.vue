<template>
  <el-tag :type="type" v-bind="$attrs" class="base-tag">
    <template v-if="showIcon">
      <div class="tag-icon" v-html="iconSvg"></div>
    </template>
    <slot></slot>
  </el-tag>
</template>

<script>
export default {
  name: 'base-tag',
  props: {
    showIcon: {
      type: Boolean,
      default: true
    },
    type: {
      type: String,
      default: ''
    }
  },
  computed: {
    iconSvg() {
      const type = this.type
      switch (type) {
        case 'success':
          return `<svg class="check-icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" >
                    <circle cx="12" cy="12" r="11" fill="#67c23a"/>
                    <path d="M7 12l3 3 7-7" stroke="#ffffff" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>`
        case 'primary':
          return `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"  >
                    <circle cx="12" cy="12" r="11" fill="#409eff"/>
                    <path d="M12 7v5h4" stroke="#ffffff" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>`
        case 'warning':
          return `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"  >
                    <circle cx="12" cy="12" r="11" fill="#eba331"/>
                    <path d="M12 7v5h4" stroke="#ffffff" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>`
        case 'yellow':
          return '<svg width="24" height="24" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M24 44C29.5228 44 34.5228 41.7614 38.1421 38.1421C41.7614 34.5228 44 29.5228 44 24C44 18.4772 41.7614 13.4772 38.1421 9.85786C34.5228 6.23858 29.5228 4 24 4C18.4772 4 13.4772 6.23858 9.85786 9.85786C6.23858 13.4772 4 18.4772 4 24C4 29.5228 6.23858 34.5228 9.85786 38.1421C13.4772 41.7614 18.4772 44 24 44Z" fill="#E1A400" stroke="#E1A400" stroke-width="4" stroke-linejoin="round"/><path fill-rule="evenodd" clip-rule="evenodd" d="M24 37C25.3807 37 26.5 35.8807 26.5 34.5C26.5 33.1193 25.3807 32 24 32C22.6193 32 21.5 33.1193 21.5 34.5C21.5 35.8807 22.6193 37 24 37Z" fill="#FFF"/><path d="M24 12V28" stroke="#FFF" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/></svg>'
        case 'warning-orange':
          return '<svg width="24" height="24" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M24 44C29.5228 44 34.5228 41.7614 38.1421 38.1421C41.7614 34.5228 44 29.5228 44 24C44 18.4772 41.7614 13.4772 38.1421 9.85786C34.5228 6.23858 29.5228 4 24 4C18.4772 4 13.4772 6.23858 9.85786 9.85786C6.23858 13.4772 4 18.4772 4 24C4 29.5228 6.23858 34.5228 9.85786 38.1421C13.4772 41.7614 18.4772 44 24 44Z" fill="#ff7700" stroke="#ff7700" stroke-width="4" stroke-linejoin="round"/><path d="M24 28.6248V24.6248C27.3137 24.6248 30 21.9385 30 18.6248C30 15.3111 27.3137 12.6248 24 12.6248C20.6863 12.6248 18 15.3111 18 18.6248" stroke="#FFF" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><path fill-rule="evenodd" clip-rule="evenodd" d="M24 37.6248C25.3807 37.6248 26.5 36.5055 26.5 35.1248C26.5 33.7441 25.3807 32.6248 24 32.6248C22.6193 32.6248 21.5 33.7441 21.5 35.1248C21.5 36.5055 22.6193 37.6248 24 37.6248Z" fill="#FFF"/></svg>'
        case 'info':
          return `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="12" cy="12" r="11" fill="#919191"/>
                    <path d="M8.5 11V8C8.5 6.067 10.067 4.5 12 4.5C13.933 4.5 15.5 6.067 15.5 8V11" stroke="white" stroke-width="2.2" stroke-linecap="round"/>
                    <rect x="7" y="10.5" width="10" height="8" rx="1.5" fill="white"/>
                    <rect x="11.2" y="13.2" width="1.6" height="2.8" rx="0.8" fill="#919191"/>
                </svg>`
        case 'loading':
          return '<svg width="24" height="24" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M24 44C35.0457 44 44 35.0457 44 24C44 12.9543 35.0457 4 24 4C12.9543 4 4 12.9543 4 24C4 35.0457 12.9543 44 24 44Z" fill="#919191" stroke="#919191" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><path d="M24 12V15" stroke="#FFF" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><path d="M32.4852 15.5147L30.3639 17.636" stroke="#FFF" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><path d="M36 24H33" stroke="#FFF" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><path d="M32.4852 32.4853L30.3639 30.364" stroke="#FFF" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><path d="M24 36V33" stroke="#FFF" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><path d="M15.5148 32.4853L17.6361 30.364" stroke="#FFF" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><path d="M12 24H15" stroke="#FFF" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><path d="M15.5148 15.5147L17.6361 17.636" stroke="#FFF" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/></svg>'
        case 'primary-blue':
          return '<svg width="24" height="24" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M24 44C35.0457 44 44 35.0457 44 24C44 12.9543 35.0457 4 24 4C12.9543 4 4 12.9543 4 24C4 35.0457 12.9543 44 24 44Z" fill="#87CEEB" stroke="#87CEEB" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><path d="M24 12V15" stroke="#FFF" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><path d="M32.4852 15.5147L30.3639 17.636" stroke="#FFF" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><path d="M36 24H33" stroke="#FFF" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><path d="M32.4852 32.4853L30.3639 30.364" stroke="#FFF" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><path d="M24 36V33" stroke="#FFF" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><path d="M15.5148 32.4853L17.6361 30.364" stroke="#FFF" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><path d="M12 24H15" stroke="#FFF" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><path d="M15.5148 15.5147L17.6361 17.636" stroke="#FFF" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/></svg>'
        case 'danger':
          return `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="11" fill="#E84E4E"/>
                <path d="M8.5 8.5L15.5 15.5M15.5 8.5L8.5 15.5" stroke="white" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>`
        default:
          return ' '
      }
    }
  }
}
</script>

<style scoped>
.base-tag {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border-radius: 20px !important;
  padding: 4px 12px !important;
  font-size: 12px;
  height: auto;
  line-height: 1.4;
}

.tag-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 14px;
  height: 14px;
  flex-shrink: 0;
}

.tag-icon svg {
  width: 100%;
  height: 100%;
}
</style>
