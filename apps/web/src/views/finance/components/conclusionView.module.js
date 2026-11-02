export const isImage = (fileName) => {
  return /\.(png|jpe?g|gif|bmp|webp)$/i.test(fileName)
}
