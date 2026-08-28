import { reactive, ref } from 'vue'
import { formatNumValue } from '@/utils/utils'

export const mianPage = () => {
  const userInfo = ref<{
    deptId: string
    deptName: string
    dwId: string
    dwName: string
    roleCode: string
    spRoleId: string
    specialorgcode: string
    roleName: string
    roleId: string
    fqzzFlag: string
  }>({
    deptId: '',
    deptName: '',
    dwId: '',
    dwName: '',
    roleCode: '',
    spRoleId: '',
    roleName: '',
    specialorgcode: '',
    roleId: '',
    fqzzFlag: ''
  })
  const deModeOptions = ref<any[]>([
    { name: '通用-定额测算', code: '0', url: '/service/xmcs/decs' },
    { name: '电缆-定额测算', code: '1', url: '/service/xmcs/decsDl' },
    { name: '架空-定额测算', code: '2', url: '/service/xmcs/decsJk' },
    { name: '营销-定额测算', code: '3', url: '/service/xmcs/decsYx' },
    { name: '配网-设备检修', code: '4', url: '/service/xmcs/decsPwDPdgc' },
    { name: '配网-安装拆除', code: '5', url: '/service/xmcs/decsPwCc' },
    { name: '配网-工程', code: '6', url: '/service/xmcs/decsPwGc' },
    { name: '配网-建筑修缮【价差0】', code: '7', url: '/service/xmcs/decsPwJzxsJcl' },
    { name: '配网-建筑修缮【价差按时】', code: '8', url: '/service/xmcs/decsPwJzxsJcas' },
    { name: '配网-电缆', code: '9', url: '/service/xmcs/decsPwDl' },
    { name: '配网-架空', code: '10', url: '/service/xmcs/decsPwJk' }
  ])
  const cellStyle = ({ row, column }: any) => {
    if (column.field == 'zzywcbbz') {
      return {
        color: 'blue'
      }
    }
    if (column.field == 'gzytzdj') {
      return {
        color: 'red'
      }
    }
  }
  const MERGE_PROPS = [
    'id',
    'yj',
    'ej',
    'sj',
    'deptName',
    'xmmc',
    'zxcsstatusName',
    'byxyj',
    'zyxfName',
    'aplxName',
    'sfyapName',
    'isYsyyName',
    'mblx',
    'qksm',
    'whnr',
    'pjzb',
    'sxName',
    'creator',
    'sjsbyjhxyw'
  ]

  const DY_PROPS = [
    'dyBz',
    'dyId',
    'fourzerosixwcsjg',
    'gzllyyjName',
    'gzytzdj',
    'lscbpjz',
    'sfxjName',
    'sheetid',
    'sheetname',
    'decsjg',
    'bjjg',
    'sszq',
    'dw',
    'zzywcbbz',
    'gwbzjg',
    'zymc',
    'dyyj'
  ]
  const MERGE_TYPES = ['checkbox'] // 需要合并的特殊列类型 , 'seq'
  const spanMergeCache = ref<
    Array<{
      projectStart: number
      projectEnd: number
      dyStart: number
      dyEnd: number
    }>
  >([])
  const gzlData = (dy: any) => {
    const gzlList: any[] = []
    dy.forEach((gzl: any) => {
      const gzljnrList = gzl?.gzljnrList || []
      const gzlLength = Math.max(gzljnrList.length, 1)
      for (let i = 0; i < gzlLength; i++) {
        gzlList.push({
          gzllyyj: gzl?.gzllyyj || '',
          sfxj: gzl?.sfxj || '',
          gzllyyjName: gzl?.gzllyyjName || '',
          sfxjName: gzl?.sfxjName || '',
          gzytzdj: gzl?.gzytzdj || '',
          lscbpjz: gzl?.lscbpjz || '',
          sheetid: gzl?.sheetid || '',
          sheetname: gzl?.sheetname || '',
          sszq: gzl?.sszq || '',
          zzywcbbz: gzl?.zzywcbbz || '',
          gwbzjg: gzl?.gwbzjg || '',
          zymc: gzl?.zymc || '',
          dyyj: gzl?.dyyj || '',
          bjjg: gzl?.bjjg || '',
          decsjg: gzl?.decsjg || '',
          dw: gzl?.dw || '',
          dyBz: gzl?.dyBz || '',
          dyId: gzl?.dyId || '',
          fourzerosixwcsjg: gzl?.fourzerosixwcsjg || '',
          rgmc: gzljnrList[i]?.rgmc || '',
          rgsl: gzljnrList[i]?.rgsl || '',
          jxmc: gzljnrList[i]?.jxmc || '',
          jxsl: gzljnrList[i]?.jxsl || '',
          clmc: gzljnrList[i]?.clmc || '',
          clsl: gzljnrList[i]?.clsl || ''
        })
      }
    })
    return gzlList
  }

  const spanMethodData = (data: any) => {
    const result: any[] = []
    data.forEach((item: any) => {
      const dyList = gzlData(item.dyList || [])
      const maxLength = Math.max(dyList.length, 1)
      for (let i = 0; i < maxLength; i++) {
        result.push({
          sx: item?.sx || '',
          zyxf: item?.zyxf || '',
          aplx: item?.aplx || '',
          sfyapName: item?.sfyapName || '',
          sfyap: item?.sfyap || '',
          sxName: item?.sxName || '',
          zyxfName: item?.zyxfName || '',
          aplxName: item?.aplxName || '',
          isYsyyName: item?.isYsyyName || '',
          qksm: item?.qksm || '',
          byxyj: item?.byxyj || '',
          bz: item?.bz || '',
          creator: item?.creator || '',
          sjsbyjhxyw: item?.sjsbyjhxyw || '',
          editFlag: item?.editFlag || '',
          ej: item?.ej || '',
          id: item?.id,
          pjzb: item?.pjzb || '',
          mblx: item?.mblx || '',
          sj: item?.sj || '',
          whnr: item?.whnr || '',
          xmmc: item?.xmmc,
          yj: item?.yj || '',
          deptName: item?.deptName || '',
          zxcsstatus: item?.zxcsstatus || '',
          zxcsstatusName: item?.zxcsstatusName || '',
          dyBz: dyList[i]?.dyBz || '',
          dyId: dyList[i]?.dyId || '',
          fourzerosixwcsjg: dyList[i]?.fourzerosixwcsjg || '',
          gzllyyj: dyList[i]?.gzllyyj || '',
          sfxj: dyList[i]?.sfxj || '',
          gzllyyjName: dyList[i]?.gzllyyjName || '',
          sfxjName: dyList[i]?.sfxjName || '',
          gzytzdj: dyList[i]?.gzytzdj || '',
          lscbpjz: dyList[i]?.lscbpjz || '',
          sheetid: dyList[i]?.sheetid || '',
          sheetname: dyList[i]?.sheetname || '',
          decsjg: dyList[i]?.decsjg || '',
          bjjg: dyList[i]?.bjjg || '',
          sszq: dyList[i]?.sszq || '',
          dw: dyList[i]?.dw || '',
          gzljnr: dyList[i]?.gzljnr || '',
          zzywcbbz: dyList[i]?.zzywcbbz || '',
          gwbzjg: dyList[i]?.gwbzjg || '',
          zymc: dyList[i]?.zymc || '',
          dyyj: dyList[i]?.dyyj || '',
          rgmc: dyList[i]?.rgmc || '',
          rgsl: dyList[i]?.rgsl || '',
          jxmc: dyList[i]?.jxmc || '',
          jxsl: dyList[i]?.jxsl || '',
          clmc: dyList[i]?.clmc || '',
          clsl: dyList[i]?.clsl || '',
          dyRowIndex: i,
          dyRowSpan: maxLength
        })
      }
    })
    return result
  }

  const buildSpanCache = (tableData: any[]) => {
    const cache: Array<{
      projectStart: number
      projectEnd: number
      dyStart: number
      dyEnd: number
    }> = []
    const isSameProject = (a: any, b: any) => MERGE_PROPS.every((p) => a[p] === b[p])
    const isSameDy = (a: any, b: any) => isSameProject(a, b) && DY_PROPS.every((p) => a[p] === b[p])

    let i = 0
    while (i < tableData.length) {
      let pEnd = i
      while (pEnd + 1 < tableData.length && isSameProject(tableData[pEnd + 1], tableData[i])) pEnd++
      let j = i
      while (j <= pEnd) {
        let dEnd = j
        while (dEnd + 1 <= pEnd && isSameDy(tableData[dEnd + 1], tableData[j])) dEnd++
        for (let k = j; k <= dEnd; k++) {
          cache[k] = {
            projectStart: i,
            projectEnd: pEnd,
            dyStart: j,
            dyEnd: dEnd
          }
        }
        j = dEnd + 1
      }
      i = pEnd + 1
    }
    spanMergeCache.value = cache
  }

  const objectSpanMethod = ({ column, rowIndex }: any) => {
    const prop = column.field
    const type = column.type
    const isProjectCol = MERGE_PROPS.includes(prop) || MERGE_TYPES.includes(type)
    const isDyCol = DY_PROPS.includes(prop)
    if (!isProjectCol && !isDyCol) return { rowspan: 1, colspan: 1 }

    const cache = spanMergeCache.value
    if (!cache.length || !cache[rowIndex]) return { rowspan: 1, colspan: 1 }

    const info = cache[rowIndex]
    if (isDyCol) {
      if (rowIndex === info.dyStart) {
        return { rowspan: info.dyEnd - info.dyStart + 1, colspan: 1 }
      }
      return { rowspan: 0, colspan: 0 }
    }
    if (rowIndex === info.projectStart) {
      return { rowspan: info.projectEnd - info.projectStart + 1, colspan: 1 }
    }
    return { rowspan: 0, colspan: 0 }
  }
  const gridOptions = reactive<any>({
    stripe: true,
    border: true,
    loading: false,
    headerAlign: 'center',
    emptyRender: '请查询',
    align: 'center',
    // checkboxConfig: {
    //   trigger: 'row',
    //   highlight: true
    // },
    spanMethod: objectSpanMethod,
    height: '100%',
    rowConfig: {
      height: 32
    },
    columnConfig: {
      resizable: true
    },
    size: 'mini',
    data: [],
    cellStyle: cellStyle,
    columns: [
      { type: 'checkbox', width: 50, fixed: 'left' },
      // { type: 'seq', width: 50, title: '序号' },
      { field: 'deptName', title: '部门', width: 80, fixed: 'left' },
      {
        field: 'xmlx',
        title: '项目类型',
        fixed: 'left',
        children: [
          { field: 'yj', title: '一级', width: 100, fixed: 'left' },
          { field: 'ej', title: '二级', width: 100, fixed: 'left' },
          { field: 'sj', title: '三级', width: 100, fixed: 'left' }
        ]
      },
      {
        field: 'xmmc',
        title: '项目名称',
        width: 150,
        fixed: 'left',
        align: 'left',
        headerAlign: 'center'
      },
      { field: 'sxName', title: '属性', width: 80 },
      {
        field: 'zxcsstatusName',
        title: '状态',
        width: 110
      },
      { field: 'byxyj', title: '必要性依据', width: 200, align: 'left', headerAlign: 'center' },
      { field: 'zyxfName', title: '专业细分', width: 80 },
      { field: 'aplxName', title: '安排类型', width: 80 },
      { field: 'sfyapName', title: '是否预安排', width: 100 },
      { field: 'whnr', title: '工作内容', width: 200, align: 'left', headerAlign: 'center' },
      { field: 'pjzb', title: '评价指标', width: 180, align: 'left', headerAlign: 'center' },
      { field: 'isYsyyName', title: '是否一事一议', width: 100 },
      { field: 'qksm', title: '情况说明', width: 180, align: 'left', headerAlign: 'center' },
      { field: 'sjsbyjhxyw', title: '是否涉及核心业务', width: 180, align: 'center', headerAlign: 'center' },
      {
        field: 'dyList',
        title: '动因信息',
        children: [
          { field: 'sheetname', title: '动因', width: 120, align: 'left', headerAlign: 'center' },
          {
            field: 'gzljnr',
            title: '工作量及内容',
            children: [
              {
                field: 'rgList',
                title: '人工',
                children: [
                  { field: 'rgmc', title: '名称', width: 180 },
                  { field: 'rgsl', title: '数量', width: 100 }
                ]
              },
              {
                field: 'jxList',
                title: '机械',
                children: [
                  { field: 'jxmc', title: '名称', width: 180 },
                  { field: 'jxsl', title: '数量', width: 100 }
                ]
              },
              {
                field: 'zzxclList',
                title: '装置性材料',
                children: [
                  { field: 'clmc', title: '名称', width: 180 },
                  { field: 'clsl', title: '数量', width: 100 }
                ]
              }
            ]
          },
          { field: 'dw', title: '单位', width: 100 },
          { field: 'sszq', title: '实施周期', width: 100 },
          { field: 'sfxjName', title: '是否询价', width: 80 },
          {
            field: 'gzllyyjName',
            title: '工作量来源依据',
            width: 80
          },
          {
            field: 'fourzerosixwcsjg',
            title: '406号文方法(单位：元)',
            width: 180,
            align: 'right',
            headerAlign: 'center',
            formatter({ row }: any) {
              if (typeof row.fourzerosixwcsjg === 'undefined' || row.fourzerosixwcsjg === null || row.fourzerosixwcsjg === '') return '0.00'
              return formatNumValue(row.fourzerosixwcsjg.toString(), 2)
            }
          },
          {
            field: 'decsjg',
            title: '检修定额方法(单位：元)',
            width: 180,
            align: 'right',
            headerAlign: 'center',
            formatter({ row }: any) {
              if (typeof row.decsjg === 'undefined' || row.decsjg === null || row.decsjg === '') return '0.00'
              return formatNumValue(row.decsjg.toString(), 2)
            }
          },
          {
            field: 'lscbpjz',
            title: '历史成本(单位 :元)',
            width: 180,
            align: 'right',
            headerAlign: 'center',
            formatter({ row }: any) {
              if (typeof row.lscbpjz === 'undefined' || row.lscbpjz === null || row.lscbpjz === '') return '0.00'
              return formatNumValue(row.lscbpjz.toString(), 2)
            }
          },
          { field: 'bjjg', title: '比较结果', width: 160, align: 'left', headerAlign: 'center' },
          {
            field: 'zzywcbbz',
            title: '最终运维参考价(单位 :元)',
            width: 180,
            align: 'right',
            headerAlign: 'center',
            formatter({ row }: any) {
              if (typeof row.zzywcbbz === 'undefined' || row.zzywcbbz === null || row.zzywcbbz === '') return '0.00'
              return formatNumValue(row.zzywcbbz.toString(), 2)
            }
          },
          {
            field: 'gzytzdj',
            title: '各专业调整参考价(单位 :元)',
            width: 180,
            align: 'right',
            headerAlign: 'center',
            formatter({ row }: any) {
              if (typeof row.gzytzdj === 'undefined' || row.gzytzdj === null || row.gzytzdj === '') return '0.00'
              return formatNumValue(row.gzytzdj.toString(), 2)
            }
          },
          {
            field: 'gwbzjg',
            title: '国网标准(单位 :元)',
            width: 180,
            align: 'right',
            headerAlign: 'center',
            formatter({ row }: any) {
              if (typeof row.zymc === 'undefined' || row.zymc === null || row.zymc === '') return '-'
              return formatNumValue(row.gwbzjg.toString(), 2)
            }
          },
          { field: 'dyyj', title: '预警', width: 120, align: 'left', headerAlign: 'center' },
          { field: 'dyBz', title: '备注', width: 120 }
        ]
      },
      { field: 'creator', title: '编制人', width: 80 }
    ]
  })
  return {
    userInfo,
    gridOptions,
    spanMethodData,
    buildSpanCache,
    spanMergeCache,
    deModeOptions
  }
}
