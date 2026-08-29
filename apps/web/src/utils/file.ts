import app from '@/constants/app'
import baseService from '@/service/baseService'
import { getServerUrl } from '@/utils/system'

export type FileData = {
  name: string
  url: string
}

export const getFileBySysFileId = (id: string) => {
  if (id == null) {
    return
  }
  return baseService.blob(getServerUrl() + `/common/file/download/${id}`)
}

export const getUploadFileDataList = (fileList: any[]) => {
  const fileDataList: any[] = []
  fileList.forEach((f) => {
    fileDataList.push(getUploadFileData(f))
  })

  return fileDataList
}
export const getUploadFileData = (file: any) => {
  return new Promise((resolve, reject) => {
    if (file.status != 'ready') {
      resolve(file)
    } else {
      const fr = new FileReader()
      fr.readAsDataURL(file.raw)
      fr.onload = (e: any) => {
        const result: FileData = {
          name: file.name,
          url: e.currentTarget.result
        }

        resolve(result)
      }
    }
  })
}

export default class FileView {
  public fileList: FileData[] = []
  public fileMaxNum: number
  public isChangeResource: boolean = false
  constructor(fileMaxNum: number) {
    this.fileMaxNum = fileMaxNum
  }

  // 通过文件地址转换为数据并push到对应数组中
  public getFileData(resourceList: string[]) {
    if (resourceList.length == 0) {
      return
    }
    resourceList.forEach((id) => {
      // 因为资源id是以long型去存储的，所以有可能经过后端的转换后，原本为null的值会变成0
      if (id != '0') {
        const requestUrl = getServerUrl() + `/common/file/download/${id}`
        baseService.blob(requestUrl).then((res) => {
          const temp: any = res
          this.fileList.push(temp)
        })
      }
    })
  }

  // 资源修改事件
  public changeHandle(file: any, fileList: any): void {
    this.isChangeResource = true
    this.fileList = []
    getUploadFileDataList(fileList).forEach((promise: Promise<any>) => {
      // 对文件数量做限制
      promise.then((fileData: any) => {
        this.fileList.push(fileData)
      })
    })
  }
  public removeHandle(file: any) {
    this.isChangeResource = true
    const arr = this.fileList
    console.log(arr)

    const newArr: any = []
    for (let i = 0; i < arr.length; i++) {
      const e = arr[i]
      // 如果文件名称为空，则是无效文件，大概率是无意间造成的问题
      console.log(e.name)

      if (e.name == undefined) {
        continue
      }
      if (e.name != file.name) {
        newArr.push(e)
      }
    }
    this.fileList = newArr
  }
}
