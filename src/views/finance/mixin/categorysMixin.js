import { CwProject, FinanceReserveNotice, Category, CwCategoryInvest } from '@/api/mainController'

const categorysMixin = {
  data() {
    return {
      categorysKeyValue: {
        year: ['batchId', 'categoryId', 'keyInvestId', 'courseTitleId'],
        batchId: ['categoryId', 'keyInvestId', 'courseTitleId'],
        categoryId: ['keyInvestId', 'courseTitleId'],
        keyInvestId: ['courseTitleId'],
        courseTitleId: []
      },
      selectImpl: {
        year: [],
        batchId: [],
        categoryId: [],
        keyInvestId: [],
        courseTitleId: []
      }
    }
  },
  methods: {
    handleCategoryEventChange(dataValue, key, value, callback = () => {}) {
      dataValue = {
        ...dataValue,
        [key]: value
      }

      this.categorysKeyValue[key].forEach((k) => {
        dataValue[k] = null
        this.selectImpl[k] = []
      })
      const [nextKey] = this.categorysKeyValue[key]
      if (nextKey && value != null && value != '') {
        callback((res) => {
          this.selectImpl = {
            ...this.selectImpl,
            [nextKey]: res
          }
        })
      }
      return dataValue
    },
    handleCategoryChange(dataValue, key, value) {
      dataValue = {
        ...dataValue,
        [key]: value
      }
      this.categorysKeyValue[key].forEach((k) => {
        dataValue[k] = null
        this.selectImpl[k] = []
      })
      const [nextKey] = this.categorysKeyValue[key]
      if (nextKey) {
        this.getCategorys(dataValue[key], (res) => {
          this.selectImpl = {
            ...this.selectImpl,
            [nextKey]: res
          }
        })
      }
      return dataValue
    },
    async getDefaultCategory(dataValue, flag) {
      let { year, batchId, categoryId, keyInvestId, courseTitleId } = dataValue || {}
      await this.yearList({}, (res) => {
        this.selectImpl = {
          ...this.selectImpl,
          year: res.map((item) => ({ label: item, value: item }))
        }
      })
      if (year) {
        // taskstatus: 1
        await this.getFinanceReserveNotice({ financeReserveNoticeDtoFilter: { taskstatus: flag ? 1 : null, year } }, (res) => {
          this.selectImpl = {
            ...this.selectImpl,
            batchId: res.dataList
          }
        })
      }
      if (batchId) {
        batchId = typeof batchId == 'string' ? batchId : batchId.join(',')
        // const [{ cwCategoryId }] = this.selectImpl.batchId.filter(item => item.reserveId == batchId);
        const array = this.selectImpl.batchId.filter((item) => batchId.indexOf(item.reserveId) > -1)
        if (array && array.length > 0) {
          // const cwCategoryId = array.map(item => item.cwCategoryId).join(',');
          const cwCategoryId = array.map((item) => item.cwCategoryId)?.[0]
          await this.getCategorys(cwCategoryId, (res) => {
            this.selectImpl = {
              ...this.selectImpl,
              categoryId: res
            }
          })
        }
      }
      if (categoryId) {
        if (this.selectImpl.categoryId.length > 0 && this.selectImpl.categoryId.find((item) => item.id == categoryId)) {
          await this.getCwCategoryInvest(categoryId, (res) => {
            this.selectImpl = {
              ...this.selectImpl,
              keyInvestId: res
            }
          })
        } else {
          this.$message.warning('类型模版已发生变更，请重新选择类型、重点投向及预算事项')
          categoryId = null
          keyInvestId = null
          courseTitleId = null
          dataValue.categoryId = null
          dataValue.keyInvestId = null
          dataValue.courseTitleId = null
        }
      }
      if (keyInvestId) {
        if (this.selectImpl.keyInvestId.length > 0 && this.selectImpl.keyInvestId.find((item) => item.id == keyInvestId)) {
          await this.getCwCategoryInvestItemsList(keyInvestId, (res) => {
            this.selectImpl = {
              ...this.selectImpl,
              courseTitleId: res
            }
          })
        } else {
          this.$message.warning('重点投向已发生变更，请重新选择重点投向及预算事项')
          keyInvestId = null
          courseTitleId = null
          dataValue.keyInvestId = null
          dataValue.courseTitleId = null
        }
      }
      if (courseTitleId && !this.selectImpl.courseTitleId.find((item) => item.id == courseTitleId)) {
        this.$message.warning('预算事项已发生变更，请重新选择预算事项')
        courseTitleId = null
        dataValue.courseTitleId = null
      }

      if (dataValue && (!batchId || batchId.length == 0) && this.selectImpl.batchId.length > 0) {
        // dataValue.batchId = [this.selectImpl.batchId?.[0].reserveId].filter(item => item);
        const array = this.selectImpl.batchId.filter((item) => item.reserveId == dataValue.batchId)
        if (array) {
          dataValue = this.handleCategoryEventChange(dataValue, 'batchId', dataValue.batchId, (callback) => {
            // const cwCategoryId = array.map(item => item.cwCategoryId).join(',');
            const cwCategoryId = array.map((item) => item.cwCategoryId)?.[0]
            this.getCategorys(cwCategoryId, (res) => {
              callback(res)
            })
          })
        }
      }
      return dataValue
    },
    // 储备批次数据
    yearList(params, callback = () => {}) {
      return FinanceReserveNotice.yearList(this, params, null, { showMask: false }).then((res) => {
        callback(res.data)
      })
    },
    getCategorys(parentId, callback = () => {}) {
      return CwProject.categorys(this, { parentId }, null, { showMask: false }).then((res) => {
        callback(res.data)
      })
    },
    // 储备批次数据
    getFinanceReserveNotice(params, callback = () => {}) {
      return FinanceReserveNotice.list(this, params, null, { showMask: false }).then((res) => {
        callback(res.data)
      })
    },
    // 查询重点投向
    getCwCategoryInvest(parentId, callback = () => {}) {
      let cwCategoryInvestDtoFilter = {
        parentId
      }
      return CwCategoryInvest.list(this, { cwCategoryInvestDtoFilter }, null, { showMask: false }).then((res) => {
        callback(res.data.dataList)
      })
    },
    //  查询预算事项
    getCwCategoryInvestItemsList(id, callback = () => {}) {
      return CwCategoryInvest.view(this, { id }, null, { showMask: false }).then((res) => {
        if (res.data) {
          const { cwCategoryInvestItemsList } = res.data
          callback(cwCategoryInvestItemsList)
        }
      })
    },
    getCategoryFilter(dataValue, finalCallback = () => {}, obj, options = {}) {
      const filters = [
        {
          tag: 'select',
          prop: 'year',
          label: '储备年份',
          attrs: {
            props: { value: 'value', label: 'label' },
            options: this.selectImpl.year || [],
            filterable: true
          },
          listeners: {
            change: (year) => {
              dataValue = this.handleCategoryEventChange(dataValue, 'year', year, (callback) => {
                this.getFinanceReserveNotice({ financeReserveNoticeDtoFilter: { year, taskstatus: options.taskstatus } }, (res) => {
                  this.selectImpl = {
                    ...this.selectImpl,
                    batchId: res.dataList
                  }
                })
              })
              finalCallback(dataValue, 'year')

              // if (year) {
              // }
            }
          },
          ...obj
        },
        {
          tag: 'select',
          prop: 'batchId',
          label: '储备批次',
          attrs: {
            props: { value: 'reserveId', label: 'batchTitle' },
            options: this.selectImpl.batchId || [],
            filterable: true,
            multiple: options.multiple,
            'collapse-tags': options['collapse-tags']
          },
          listeners: {
            change: (reserveId) => {
              // if (reserveId) {
              // reserveId = typeof reserveId == 'string' ? reserveId : reserveId.join(',');
              // if (reserveId) {
              const array = this.selectImpl.batchId.filter((item) => reserveId.indexOf(item.reserveId) > -1)
              if (array) {
                const cwCategoryId = array.map((item) => item.cwCategoryId)?.[0]
                dataValue = this.handleCategoryEventChange(dataValue, 'batchId', reserveId, (callback) => {
                  this.getCategorys(cwCategoryId, (res) => {
                    callback(res)
                  })
                })
                finalCallback(dataValue, 'batchId')
              }
              // }
            }
            // }
          },
          ...obj
        },
        {
          tag: 'select',
          prop: 'categoryId',
          label: '项目类型',
          attrs: {
            props: { value: 'id', label: 'name', checkStrictly: true },
            options: this.selectImpl.categoryId || [],
            filterable: true
          },
          listeners: {
            change: (categoryId) => {
              dataValue = this.handleCategoryEventChange(dataValue, 'categoryId', categoryId, (callback) => {
                this.getCwCategoryInvest(categoryId, (res) => {
                  callback(res)
                })
              })
              finalCallback(dataValue, 'categoryId')
            }
          },
          ...obj
        },
        {
          tag: 'select',
          prop: 'keyInvestId',
          label: '重点投向',
          attrs: {
            props: { value: 'id', label: 'name', checkStrictly: true },
            options: this.selectImpl.keyInvestId || [],
            filterable: true
          },
          listeners: {
            change: (keyInvestId) => {
              dataValue = this.handleCategoryEventChange(dataValue, 'keyInvestId', keyInvestId, (callback) => {
                this.getCwCategoryInvestItemsList(keyInvestId, (res) => {
                  callback(res)
                })
              })
              finalCallback(dataValue, 'keyInvestId')
            }
          },
          ...obj
        },
        {
          tag: 'select',
          prop: 'courseTitleId',
          label: '预算事项',
          attrs: {
            props: { value: 'id', label: 'name', checkStrictly: true },
            options: this.selectImpl.courseTitleId || [],
            filterable: true
          },
          listeners: {
            change: (courseTitleId) => {
              dataValue.courseTitleId = courseTitleId
              finalCallback(dataValue, 'courseTitleId')
            }
          },
          ...obj
        }
      ]

      // 根据showProps过滤显示的筛选条件
      if (options.showProps) {
        const showProps = Array.isArray(options.showProps) ? options.showProps : [options.showProps]
        return filters.filter((filter) => showProps.includes(filter.prop))
      }

      // 如果没有showProps，返回所有筛选条件
      return filters
    }
  },
  watch: {},
  computed: {}
}

export { categorysMixin }
