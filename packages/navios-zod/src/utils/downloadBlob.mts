
export function downloadBlob(data: Blob, fileName: string) {
  const blobUrl = window.URL.createObjectURL(data)
  const a = document.createElement('a')
  a.href = blobUrl
  a.download = fileName
  document.body.appendChild(a) // we need to append the element to the dom -> otherwise it will not work in firefox
  a.click()
  a.remove()
}
