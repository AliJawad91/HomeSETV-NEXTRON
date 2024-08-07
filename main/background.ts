// import path from 'path';
// import { app, ipcMain } from 'electron';
// import serve from 'electron-serve';
// import { createWindow } from './helpers';

// require('./server');
// const isProd = process.env.NODE_ENV === 'production';

// if (isProd) {
//   serve({ directory: 'app' });
// } else {
//   app.setPath('userData', `${app.getPath('userData')} (development)`);
// }

// (async () => {
//   await app.whenReady();

//   const mainWindow = createWindow('main', {
//     width: 720,
//     height: 510,
//     webPreferences: {
//       preload: path.join(__dirname, 'preload.js'),
//       contextIsolation:true,
//       nodeIntegration:true,
//     },
//   });

//   if (isProd) {
//     await mainWindow.loadURL('app://./home');
//   } else {
//     const port = process.argv[2];
//     await mainWindow.loadURL(`http://localhost:${port}/home`);
//     // mainWindow.webContents.openDevTools();
//   }
// })();

// app.on('window-all-closed', () => {
//   app.quit();
// });

// ipcMain.on('message', async (event, arg) => {
//   event.reply('message', `${arg} World!`);
// });
import path from 'path';
import { app, ipcMain } from 'electron';
import serve from 'electron-serve';
import { createWindow } from './helpers';
import NodeMediaServer from 'node-media-server';
import { spawn } from 'child_process';

const isProd = process.env.NODE_ENV === 'production';

if (isProd) {
  serve({ directory: 'app' });
} else {
  app.setPath('userData', `${app.getPath('userData')} (development)`);
}

(async () => {
  await app.whenReady();

  const config = {
    rtmp: {
      port: 1935,
      chunk_size: 60000,
      gop_cache: true,
      ping: 60,
      allow_anonymous: true
    },
    http: {
      port: 80,
      allow_origin: '*'
    }
  };

  const nms = new NodeMediaServer(config);
  nms.run();

  nms.on('publish', (id, streamPath) => {
    console.log('[NodeMediaServer] publish app:', id, ' streamPath:', streamPath);

    // Construct FFmpeg command
    const ffmpegCommand = [
      '-f', 'avfoundation',
      '-rtbufsize', '10M', // Adjust buffer size as needed
      '-framerate', '30',
      '-i', '0',
      '-c:v', 'libx264',
      '-preset', 'ultrafast',
      '-b:v', '500k',
      '-maxrate', '500K',
      '-f', 'flv',
      `rtmp://localhost:1935/${streamPath}`
    ];

    // Spawn FFmpeg process
    const ffmpegProcess = spawn('ffmpeg', ffmpegCommand);

    ffmpegProcess.stderr.on('data', (data) => {
      const log = data.toString();
      console.error(`ffmpeg stderr: ${log}`);

      // Handle FFmpeg errors and buffer adjustments here
    });

    ffmpegProcess.on('close', () => {
      console.log('FFmpeg process closed');
    });
  });

  nms.on('play', (id, streamPath) => {
    console.log('[NodeMediaServer] play app:', id, ' streamPath:', streamPath);
  });

  // ... other Node Media Server event handlers ...

  const mainWindow = createWindow('main', {
    width: 720,
    height: 510,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation:true,
      nodeIntegration:true,
    },
  });

  if (isProd) {
    await mainWindow.loadURL('app://./home');
  } else {
    const port = process.argv[2];
    await mainWindow.loadURL(`http://localhost:${port}/home`);
    // mainWindow.webContents.openDevTools();
  }
})();

app.on('window-all-closed', () => {
  app.quit();
});

ipcMain.on('message', async (event, arg) => {
  event.reply('message', `${arg} World!`);
});
