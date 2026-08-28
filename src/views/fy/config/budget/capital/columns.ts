import { VxeGridPropTypes } from 'vxe-table'

const columns: VxeGridPropTypes.Columns = [
  {
    title: '序号',
    type: 'seq',
    width: 60
  },
  {
    title: '编码',
    field: 'code',
    width: 150
  },
  {
    title: '名称',
    field: 'name',
    width: 150
  },
  {
    title: '承诺项',
    field: 'cnx',
    width: 150
  },
  {
    title: '是否可控',
    field: 'isControl',
    width: 100,
    formatter: ({ cellValue }: { cellValue: string }) => {
      const controlValue = {
        '0': '否',
        '1': '是'
      }
      return controlValue[cellValue as never] ? controlValue[cellValue as never] : ''
    }
  },
  {
    title: '是否为叶子节点',
    field: 'isLeaf',
    width: 120,
    formatter: ({ cellValue }: { cellValue: string }) => {
      const isLeafValue = {
        '0': '否',
        '1': '是'
      }
      return isLeafValue[cellValue as never] ? isLeafValue[cellValue as never] : ''
    }
  },
  {
    title: '状态',
    field: 'recState',
    width: 100,
    formatter: ({ cellValue }: { cellValue: string }) => {
      const isLeafValue = {
        '0': '停用',
        '1': '启用'
      }
      return isLeafValue[cellValue as never] ? isLeafValue[cellValue as never] : ''
    }
  },
  {
    title: '会计科目',
    field: 'kjkm',
    width: 150
  },
  {
    title: '项目分类',
    field: 'xmfl',
    width: 150
  },
  {
    title: '描述',
    field: 'note'
  }
]

export default columns
