import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron'
import { platform } from 'os';


const handler = {
  send(channel: string, value: unknown) {
    ipcRenderer.send(channel, value)
  },
  on(channel: string, callback: (...args: unknown[]) => void) {
    const subscription = (_event: IpcRendererEvent, ...args: unknown[]) =>
      callback(...args)
    ipcRenderer.on(channel, subscription)

    return () => {
      ipcRenderer.removeListener(channel, subscription)
    }
  },
  // osVersion: () => os.platform(),
}

contextBridge.exposeInMainWorld('ipc', handler)
contextBridge.exposeInMainWorld('electron', {
  platform :()=>platform(),
})

export type IpcHandler = typeof handler
