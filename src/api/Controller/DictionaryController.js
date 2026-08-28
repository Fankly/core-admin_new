import * as staticDict from '@/staticDict'

export default class DictionaryController {
  static dictSysRole(sender, params, axiosOption, httpOption) {
    return new Promise((resolve, reject) => {
      sender
        .doUrl('admin/upms/sysRole/listDict', 'get', params, axiosOption, httpOption)
        .then((res) => {
          const dictData = new staticDict.DictionaryBase('角色字典')
          dictData.setList(res.data)
          resolve(dictData)
        })
        .catch((err) => {
          reject(err)
        })
    })
  }

  // 全局编码字典
  static dictGlobalDict(sender, params, axiosOption, httpOption) {
    return new Promise((resolve, reject) => {
      sender
        .doUrl('admin/upms/globalDict/listDict', 'get', params, axiosOption, httpOption)
        .then((res) => {
          const dictData = new staticDict.DictionaryBase('编码字典')
          dictData.setList(
            (res.data || []).map((item) => {
              return {
                ...item,
                // 设置已禁用编码字典数据项
                disabled: item.status === 1
              }
            })
          )
          resolve(dictData)
        })
        .catch((err) => {
          reject(err)
        })
    })
  }

  static dictGlobalDictByIds(sender, params, axiosOption, httpOption) {
    return new Promise((resolve, reject) => {
      sender
        .doUrl('admin/upms/globalDict/listDictByIds', 'get', params, axiosOption, httpOption)
        .then((res) => {
          const dictData = new staticDict.DictionaryBase('编码字典')
          dictData.setList(res.data)
          resolve(dictData)
        })
        .catch((err) => {
          reject(err)
        })
    })
  }

  static dictSysUserStatus() {
    return new Promise((resolve) => {
      resolve(staticDict.SysUserStatus)
    })
  }

  static dictSysUserType() {
    return new Promise((resolve) => {
      resolve(staticDict.SysUserType)
    })
  }

  static dictSysDept(sender, params, axiosOption, httpOption) {
    return new Promise((resolve, reject) => {
      sender
        .doUrl('/admin/upms/sysDept/listDict', 'get', params, axiosOption, httpOption)
        .then((res) => {
          const dictData = new staticDict.DictionaryBase('部门字典')
          dictData.setList(res.data)
          resolve(dictData)
        })
        .catch((err) => {
          reject(err)
        })
    })
  }

  static dictDept(sender, params, axiosOption, httpOption) {
    return new Promise((resolve, reject) => {
      sender
        .doUrl('/admin/app/content/listDict', 'get', params, axiosOption, httpOption)
        .then((res) => {
          const dictData = new staticDict.DictionaryBase('部门字典')
          dictData.setList(res.data)
          resolve(dictData)
        })
        .catch((err) => {
          reject(err)
        })
    })
  }

  static dictSysDeptByParentId(sender, params, axiosOption, httpOption) {
    return new Promise((resolve, reject) => {
      sender
        .doUrl('/admin/upms/sysDept/listDictByParentId', 'get', params, axiosOption, httpOption)
        .then((res) => {
          const dictData = new staticDict.DictionaryBase('部门字典')
          dictData.setList(res.data)
          resolve(dictData)
        })
        .catch((err) => {
          reject(err)
        })
    })
  }

  static dictSysDeptGetChild(sender, params, axiosOption, httpOption) {
    return new Promise((resolve, reject) => {
      sender
        .doUrl('/admin/upms/sysDept/listAllChildDeptIdByParentIds', 'get', params, axiosOption, httpOption)
        .then((res) => {
          const dictData = new staticDict.DictionaryBase('部门字典')
          dictData.setList(res.data, 'deptId')
          resolve(dictData)
        })
        .catch((err) => {
          reject(err)
        })
    })
  }

  static dictAllMenu(sender, params, axiosOption, httpOption) {
    return new Promise((resolve, reject) => {
      sender
        .doUrl('admin/upms/sysMenu/listDict', 'get', params, axiosOption, httpOption)
        .then((res) => {
          const dictData = new staticDict.DictionaryBase('菜单字典')
          dictData.setList(res.data)
          resolve(dictData)
        })
        .catch((err) => {
          reject(err)
        })
    })
  }

  static dictSysMenu(sender, params, axiosOption, httpOption) {
    return new Promise((resolve, reject) => {
      sender
        .doUrl('admin/upms/sysMenu/listMenuDict', 'get', params, axiosOption, httpOption)
        .then((res) => {
          const dictData = new staticDict.DictionaryBase('菜单字典')
          dictData.setList(res.data)
          resolve(dictData)
        })
        .catch((err) => {
          reject(err)
        })
    })
  }
  static dictSysDataPermType() {
    return new Promise((resolve) => {
      resolve(staticDict.SysDataPermType)
    })
  }
  static dictSysDataPerm(sender, params, axiosOption, httpOption) {
    return new Promise((resolve, reject) => {
      sender
        .doUrl('admin/upms/sysDataPerm/listDict', 'get', params, axiosOption, httpOption)
        .then((res) => {
          let dictData = new staticDict.DictionaryBase('数据权限字典')
          dictData.setList(res.data)
          resolve(dictData)
        })
        .catch((err) => {
          reject(err)
        })
    })
  }

  static dictDeptPost(sender, params, axiosOption, httpOption) {
    return new Promise((resolve, reject) => {
      sender
        .doUrl('admin/upms/sysDept/listSysDeptPostWithRelation', 'get', params, axiosOption, httpOption)
        .then((res) => {
          resolve(res.data)
        })
        .catch((err) => {
          reject(err)
        })
    })
  }

  static dictSysPost(sender, params, axiosOption, httpOption) {
    return new Promise((resolve, reject) => {
      sender
        .doUrl('admin/upms/sysPost/listDict', 'get', params, axiosOption, httpOption)
        .then((res) => {
          const dictData = new staticDict.DictionaryBase('岗位字典')
          dictData.setList(res.data)
          resolve(dictData)
        })
        .catch((err) => {
          reject(err)
        })
    })
  }

  static dictOnlineDblink(sender, params, axiosOption, httpOption) {
    return new Promise((resolve, reject) => {
      sender
        .doUrl('/admin/online/onlineDblink/listDict', 'get', params, axiosOption, httpOption)
        .then((res) => {
          const dictData = new staticDict.DictionaryBase('数据库链接')
          dictData.setList(res.data)
          resolve(dictData)
        })
        .catch((err) => {
          reject(err)
        })
    })
  }

  static attrDeptListDict(sender, params, axiosOption, httpOption) {
    return new Promise((resolve, reject) => {
      sender
        .doUrl('/admin/upms/sysDept/attrListDict', 'get', params, axiosOption, httpOption)
        .then((res) => {
          const dictData = new staticDict.DictionaryBase('新部门字典')
          dictData.setList(res.data)
          resolve(dictData)
        })
        .catch((err) => {
          reject(err)
        })
    })
  }
}
