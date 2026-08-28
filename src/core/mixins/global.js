import baseService from '@/service/baseService'
import { mapMutations, mapGetters } from 'vuex'
import { getAppId } from '@/utils'

// 全局mixin对象
const globalMixin = {
  data() {
    return {
      isHttpLoading: false,
      windowWidth: window.innerWidth
    }
  },
  mounted() {
    this.windowResize()
    window.addEventListener('resize', this.windowResize)
  },
  unmounted() {
    window.removeEventListener('resize', this.windowResize)
  },
  methods: {
    windowResize() {
      this.windowWidth = window.innerWidth
      if (this.windowWidth <= 1900) {
        document.body.className = 'orange-project container-small'
      } else {
        document.body.className = 'orange-project container-medium'
      }
    },
    /**
     * 是否显示遮罩
     * @param {Boolean} isShow  是否显示
     */
    showMask(isShow) {
      isShow ? this.loadingManager.showMask() : this.loadingManager.hideMask()
    },
    /**
     * 判读用户是否有权限
     * @param {String} permCode  权限字
     */
    checkPermCodeExist(permCode) {
      if (getAppId() != null && getAppId() !== '') return true
      if ((this.getUserInfo || {}).permCodeSet != null) {
        return this.getUserInfo.permCodeSet.has(permCode)
      } else {
        return this.getUserInfo.isAdmin
      }
    },
    /**
     * 将输入的值转换成指定的类型
     * @param {Any} value
     * @param {String} type 要转换的类型（integer、float、boolean、string）
     */
    parseParams(value, type = 'string') {
      if (value == null) return value
      switch (type) {
        case 'integer':
          return Number.parseInt(value)
        case 'float':
          return Number.parseFloat(value)
        case 'boolean':
          return value === 'true' || value
        default:
          return String(value)
      }
    },
    /**
     * 将输入值转换为执行的类型数组
     * @param {Array} value 输入数组
     * @param {String} type 要转换的类型（integer、float、boolean、string）
     */
    parseArrayParams(value, type = 'string') {
      if (Array.isArray(value)) {
        return value.map((item) => {
          switch (type) {
            case 'integer':
              return Number.parseInt(item)
            case 'float':
              return Number.parseFloat(item)
            case 'boolean':
              return item === 'true' || item
            default:
              return String(item)
          }
        })
      } else {
        return []
      }
    },
    /**
     * 下载上传的文件
     * @param {*} url 下载文件的url
     * @param {*} fileName 下载文件名
     */
    downloadFile(url, fileName) {
      baseService
        .download(url, undefined, fileName, 'get')
        .then(() => {
          this.$message.success('下载文件成功')
        })
        .catch((e) => {
          if (e instanceof Blob) {
            let reader = new FileReader()
            reader.onload = function () {
              let jsonObj = JSON.parse(reader.result)
              this.$message.error((jsonObj || {}).errorMessage || '下载文件失败')
            }
            reader.readAsText(e)
          } else {
            this.$message.error('下载文件失败')
          }
        })
    },
    ...mapMutations(['setLoadingStatus'])
  },
  computed: {
    defaultFormItemSize() {
      return this.windowWidth <= 1900 ? 'small' : 'medium'
    },
    ...mapGetters(['getUserInfo'])
  },
  watch: {
    'loadingManager.loading': {
      handler: function (newValue) {
        this.isHttpLoading = newValue != null
      }
    }
  }
}

export default globalMixin
