import app from '@/constants/app'

const projectConfig = {
  baseUrl: app.api || '',
  openAdmin: false
}

export const globalConfig = {
  axiosOption: {},
  httpOption: {
    showMask: false,
    showError: true,
    throttleFlag: false,
    throttleTimeout: 50
  }
}

export default projectConfig
