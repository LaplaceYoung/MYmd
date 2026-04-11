const { contextBridge } = require('electron')

contextBridge.exposeInMainWorld('mymdDesktop', {
  runtime: 'electron'
})
