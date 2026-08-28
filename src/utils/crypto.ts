const encrypt = (text: string): string => {
  const encoder = new TextEncoder()
  const data = btoa(String.fromCharCode(...encoder.encode(text)))
  return encodeURIComponent(data)
}

const decrypt = (text: string): string => {
  try {
    const data = atob(decodeURIComponent(text))
    return data
  } catch (e) {
    return ''
  }
}

export { encrypt, decrypt }
