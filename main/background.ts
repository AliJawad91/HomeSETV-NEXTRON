import path from 'path';
import { app, ipcMain, BrowserWindow } from 'electron';
import serve from 'electron-serve';
import { createWindow } from './helpers';

const isProd = process.env.NODE_ENV === 'production';

if (isProd) {
  serve({ directory: 'app' });
} else {
  app.setPath('userData', `${app.getPath('userData')} (development)`);
}

let mainWindow: BrowserWindow | null = null;

(async () => {
  await app.whenReady();

  mainWindow = createWindow('main', {
    width: 1000,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  if (isProd) {
    await mainWindow.loadURL('app://./home');
  } else {
    const port = process.argv[2];
    await mainWindow.loadURL(`http://localhost:${port}/home`);
    mainWindow.webContents.openDevTools();
  }
})();

app.on('window-all-closed', () => {
  app.quit();
});

ipcMain.on('message', async (event, arg) => {
  event.reply('message', `${arg} World!`);
});

ipcMain.on('open-frameless-window', (event, url) => {
  let liveStreamWindow = new BrowserWindow({
    width: 700,
    height: 500,
    frame: false,
    alwaysOnTop: true,
    parent: mainWindow,
    resizable: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
    },
  });

  if (isProd) {
    liveStreamWindow.loadURL(`app://./${url}`);
  } else {
    const port = process.argv[2];
    liveStreamWindow.loadURL(`http://localhost:${port}/${url}`);
  }

  liveStreamWindow.on('closed', () => {
    liveStreamWindow = null;
  });
});
